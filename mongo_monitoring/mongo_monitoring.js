var database;
var ws;
var shellWs;

//Elements
var connection_code;

var initialTabDataID = 'shell_tab';
var initialLangDataID = 'lang_mongo';

var cached_stats = [];
var cached_skip_interval = 0;
var cached_metric_name = 'disk_used_bytes';
var cached_delta_sec = 60;
var skip_counter = 0;

var previous_commands = [];
var current_command_index = 0;

var stats_menu;

document.addEventListener("DOMContentLoaded", function (event) {
    console.log('GOOO');
    mixpanel.track('Viewed Console');
    main();
    try {
        initElements();
    } catch (e) {
        console.error(e);
    }

    var prompt_text = document.getElementById('prompt_text');

    var prompt = document.getElementById('prompt_text');
    //enter key command listener for console text
    $('#prompt_text').keyup(function (e) {
        // console.log(e.keyCode);
        if (e.keyCode === 13) {
            console.log('sending command: ' + prompt.value.trim());
            //send prompt text
            shellWs.send(prompt.value.trim());
            previous_commands.push(prompt.value.trim());
            current_command_index++;
            pushShellLine('&#62; ' + prompt.value.trim());
            prompt.value = ''; //clear

            mixpanel.track('Sent Shell Line');
        }

        if (e.keyCode == 38) {
            console.log('UP');
            console.log("cci: " + current_command_index);
            if (previous_commands[current_command_index - 1]) {
                prompt.value = previous_commands[current_command_index - 1];
                current_command_index--;
                console.log("ccisub: " + current_command_index);
            } else {
                // prompt_text.innerHTML = '';
            }
        }

        if (e.keyCode == 40) {
            console.log('DOWN');
            console.log("cci: " + current_command_index);
            if (previous_commands[current_command_index + 1]) {
                prompt.value = previous_commands[current_command_index + 1];
                current_command_index++;
                console.log("cciadd: " + current_command_index);
            } else {
                prompt.value = '';
            }
        }
    });

    window.addEventListener("resize", function () {
        resize();
    });
    resize();

    //Stat type dropdown
    stats_menu = document.getElementsByClassName('db_stats_list_template')[0].cloneNode(true);
    stats_menu.style.display = 'inline-block';

    Array.prototype.slice.call(stats_menu.children).forEach(function (item) {
        item.onclick = function () {
            showStats(cached_stats, cached_skip_interval, item.getAttribute('data-metric'));
            cached_metric_name = item.getAttribute('data-metric');
            stats_drop.close();
            document.getElementById('stats_text').innerHTML = item.innerHTML;
        }
    });

    var stats_drop = new Drop({
        target: document.getElementById('db_stats_list'),
        content: stats_menu,
        position: 'right middle',
        // openOn: 'click'
        openOn: 'click',
        tetherOptions: {
            offset: '-40px -60px;'
        }
    });

    calculateShownMetrics(); //judge metrics based on DB type

    //Stat delta dropdown
    var menu0 = document.getElementsByClassName('db_stats_delta_template')[0].cloneNode(true);
    menu0.style.display = 'inline-block';

    Array.prototype.slice.call(menu0.children).forEach(function (item) {
        item.onclick = function () {
            // showStats(cached_stats, cached_skip_interval, item.getAttribute('data-ms'));
            stats_delta_drop.close();
            document.getElementById('delta_text').innerHTML = item.innerHTML;
            var delta_sec = Math.floor(item.getAttribute('data-ms') / 1000);
            console.log('DELTA: ' + delta_sec);
            cached_delta_sec = delta_sec;

            //get stats with new delta

            ws.send(JSON.stringify({event: 'GET_STATS', delta_sec: delta_sec}));


            //hide progress
            document.getElementById('stats_progress').style.display = '';

            //opacity
            document.getElementsByClassName('chart')[0].style.opacity = '0.3';
        }
    });

    var stats_delta_drop = new Drop({
        target: document.getElementById('db_stats_delta_list'),
        content: menu0,
        // openOn: 'click'
        openOn: 'click',
        tetherOptions: {
            offset: '0px -60px;'
        }
    });

    var temp_snapshot_id;

    //set up snapshots panel
    database.snapshots.forEach(function (snapshot) {
        document.getElementById('snapshots').appendChild(getSnapshotElement(snapshot));
    });

    //set up snapshots panel
    database.exported_snapshots.forEach(function (snapshot) {
        document.getElementById('saved_snapshots').appendChild(getSavedSnapshotElement(snapshot));
    });

    //snapshots
    if (database.type.includes('SHARED')) {


    } else if (database.snapshots.length == 0) {

    }

    //shared DBS cannot take snapshots
    if (!database.type.includes('SHARED')) {
        document.getElementById('add_snapshot').onclick = function () {
            var click = this;
            //disable while we
            // document.getElementById('add_snapshot').onclick = undefined;
            createSnapshot(function (err, snapshot) {
                if (err) {
                    return;
                }

                document.getElementById('upgrade_button').style.display = 'none';
                document.getElementById('upgrade_container').style.display = '';
                document.getElementById('upgrade_text').innerText = 'Snapshotting DB';

                mixpanel.track('Created Snapshot');
                console.log('GOT SNAPSHOT ' + JSON.stringify(snapshot));
                var snap = getSnapshotElement(snapshot);
                //modify the template because we know it's in progress, wait for update
                snap.getElementsByClassName('buttons')[0].style.display = 'none';
                snap.getElementsByClassName('progress')[0].style.display = '';
                document.getElementById('snapshots').insertBefore(snap, document.getElementById('snapshots').firstChild);

                //re enable create snapshot, the API can block multiple snapshot attempts from here
                // document.getElementById('add_snapshot').onclick = click;

                //check if max size and pop off last snapshot
                if (document.getElementById('snapshots').childElementCount > database.max_snapshots) {
                    document.getElementById('snapshots').removeChild(document.getElementById('snapshots').lastElementChild)
                }
            });
        };
    }


    //set cust name
    getCustomer(function (err, customer) {
        if (err)return;

        if (customer.name) {
            document.getElementById('account_name').innerText = customer.name;
        } else {
            document.getElementById('account_name').innerText = customer.email;
        }
    });

    //Userlike hacks
    setTimeout(function () {
        document.getElementById('userlike-tab').onmousedown = function () {
            window.location.href = window.location + '#chat';
        };
    }, 5000);

    window.addEventListener("hashchange", function (e) {
        //back button press
        console.log(e);
        if (!e.newURL.includes('#chat')) {
            var close = document.getElementById('userlike-close');
            if (!close)return;
            close.click();
        }
    });
});

var upgrade_topology_container;
function resize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    if (h < 600) {
        upgrade_topology_container.style.marginBottom = '16px';
    } else {
        upgrade_topology_container.style.marginBottom = '23px';
    }
}

var current_metrics_delta = -1;
var current_metrics_offset = -1;

function main() {
    try {
        database = JSON.parse(getMeta('db'));

        if (database.temp_password) {
            setTimeout(function () {
                document.getElementById('temp_password').innerText = database.temp_password;
                document.getElementById('temp_password_input').value = database.temp_password;
                document.getElementById('passwordmodal').style.display = 'inline-block';
            }, 2500);
        }

        //progress in case of lock
        if (database.lock) {
            document.getElementById('upgrade_button').style.display = 'none';
            document.getElementById('upgrade_container').style.display = '';

            //calculate lock text
            var lockText = '';
            switch (database.lock.type) {
                case 'UPGRADE_STANDALONE': {
                    lockText = 'Upgrading Standalone'
                    break;
                }

                case 'UPGRADE_REPLICA_SET': {
                    lockText = 'Upgrading Replica Set'
                    break;
                }

                case 'ADD_REPLICA_SET_NODES': {
                    lockText = 'Adding New Nodes'
                    break;
                }

                case 'TRANSFER_TO_STANDALONE': {
                    lockText = 'Preparing for Transfer'
                    break;
                }

                case 'TRANSFER_TO_REPLICA_SET': {
                    lockText = 'Preparing for Transfer'
                    break;
                }

                case 'RESTORING': {
                    lockText = 'Restoring Database'
                    break;
                }

                case 'UPGRADE_VOLUMES': {
                    lockText = 'Upgrading Storage'
                    break;
                }
            }

            document.getElementById('upgrade_text').innerText = 'Snapshotting DB';

        }

        console.log(JSON.stringify(database, undefined, 2));
        //set up monitoring WS
        var url = 'ws://' + window.location.hostname + ':' + window.location.port + '/api/monitoring/db?db_id=' + database._id + '&api_key=' + getMeta('api_key')
        if (!window.location.href.includes('localhost')) {
            url = 'wss://' + window.location.hostname + '/api/monitoring/db?db_id=' + database._id
        }
        console.log(url);
        ws = new WebSocket(url);

        //poll to refresh the DB frequently, maybe should be cued by server side event?
        setInterval(function () {
            getDatabase(database._id, function (err, db) {
                if (err) {
                    console.error(err);
                    return;
                }

                //examine changes!

                database = db;
                console.log('Refreshed DB');
                calculateShownMetrics();

                if (database.type.includes('SHARED')) {
                    document.getElementById('backup_tab_shared_notice').style.display = '';
                    document.getElementById('backup_tab_content').style.pointerEvents = 'none';
                    document.getElementById('backup_tab_content').style.opacity = '0.2';

                    document.getElementById('settings_upgrade_notice').style.display = '';
                    document.getElementById('whitelist').style.opacity = '0.2';
                    document.getElementById('ip_input').disabled = true;
                    document.getElementById('whitelist').style.pointerEvents = 'none';

                    document.getElementById('piops').style.opacity = '0.2';
                    document.getElementById('piops_input').disabled = true;
                    document.getElementById('piops').style.pointerEvents = 'none';
                }
            });
        }, 10000);

        // connectShellWS();

        //ehh
        setWSCallbacks();

        //set up free limits!
        if (database.type.includes('SHARED')) {
            document.getElementById('backup_tab_shared_notice').style.display = '';
            document.getElementById('backup_tab_content').style.pointerEvents = 'none';
            document.getElementById('backup_tab_content').style.opacity = '0.2';

            document.getElementById('settings_upgrade_notice').style.display = '';
            document.getElementById('whitelist').style.opacity = '0.2';
            document.getElementById('ip_input').disabled = true;
            document.getElementById('whitelist').style.pointerEvents = 'none';

            document.getElementById('piops').style.opacity = '0.2';
            document.getElementById('piops_input').disabled = true;
            document.getElementById('piops').style.pointerEvents = 'none';
        }
    } catch (err) {
        console.error(err);
    }
}

function connectShellWS() {
    var url = 'ws://' + window.location.hostname + ':' + window.location.port + '/api/shell/db?db_id=' + database._id;
    if (!window.location.href.includes('localhost')) {
        url = 'wss://' + window.location.hostname + '/api/shell/db?db_id=' + database._id;
    }
    console.log(url);
    shellWs = new WebSocket(url);
}

function initElements() {
    upgrade_topology_container = document.getElementById('upgrade_topology_container');
    connection_code = document.getElementById('connection_code');
    var connection_code_copy = document.getElementById('connection_code_copy');
    // var copy_button = document.getElementById('connection_code');
    /*document.getElementById('connect_tab').onmouseover = function () {
     //show code copy button
     // connection_code_copy.style.display = 'inline-block';
     };
     document.getElementById('connect_tab').onmouseout = function () {
     //hide code copy button
     // connection_code_copy.style.display = 'none';
     };*/

    var tabchildren = Array.prototype.slice.call(document.getElementById('tabs').children);

    //set up listeners for tab buttons
    tabchildren.forEach(function (tab_icon) {
        tab_icon.primary = false;
        tab_icon.onclick = function () {
            tabchildren.forEach(function (tab_icon0) {
                tab_icon0.style.color = '#8c8c8c';
                tab_icon0.primary = false;
            });
            tab_icon.primary = true;
            tab_icon.style.color = '#FFFFFF';
            switchTabs(tab_icon.getAttribute('data-id'));
        };
        tab_icon.onmouseover = function () {
            tab_icon.style.color = '#FFFFFF';
        };

        tab_icon.onmouseout = function () {
            if (!tab_icon.primary)
                tab_icon.style.color = '#8c8c8c';
        };

        if (tab_icon.getAttribute('data-id') == initialTabDataID) {
            tab_icon.onclick();
        }
    });

    //start on shell tab
    switchTabs('monitoring_tab');

    var languageschildren = Array.prototype.slice.call(document.getElementById('languages').children);
    //set listener
    languageschildren.forEach(function (icon) {
        icon.onclick = function () {
            switch (icon.getAttribute('data-language')) {
                case 'mongodb': {
                    // connection_code.className = "language-powershell";
                    connection_code.innerHTML = Prism.highlight(getShellString(database), Prism.languages.javascript);
                    document.getElementById('connection_code_input').value = getShellString(database);
                    break;
                }
                case 'nodejs': {
                    // connection_code.className = "language-javascript";
                    connection_code.innerHTML = Prism.highlight(getNodeString(database), Prism.languages.javascript);
                    document.getElementById('connection_code_input').value = getNodeString(database);
                    break
                }
                case 'python': {
                    // connection_code.className = "language-python";
                    connection_code.innerHTML = Prism.highlight(getPythonString(database), Prism.languages.javascript);
                    document.getElementById('connection_code_input').value = getPythonString(database);
                    break
                }
                case 'java': {
                    // connection_code.className = "language-java";
                    connection_code.innerHTML = Prism.highlight(getJavaString(database), Prism.languages.javascript);
                    document.getElementById('connection_code_input').value = getJavaString(database);
                    break
                }
                default: {
                    console.error('No liid found with ' + icon.id);
                    break;
                }
            }
        };
    });

    //set init highligting and lang
    connection_code.innerHTML = Prism.highlight(getShellString(database), Prism.languages.javascript);
    document.getElementById('connection_code_input').value = getShellString(database);

    new Clipboard('#connection_code_copy');
    new Clipboard("#password_copy_button", {
        text: function (trigger) {
            return 'user: dbgrowadmin \npassword: ' + database.temp_password
        }
    });

    //check locks, handle upgrade button
    document.getElementsByClassName('upgrade_button')[0].onclick = function () {
        mixpanel.track('Clicked Console Upgrade Button');
        window.location.href = window.location.origin + '/upgrade/' + encodeURIComponent(database._id);
    };

    document.getElementById('backup_upgrade_link').onclick = function () {
        mixpanel.track('Clicked Backup Upgrade Button');
        window.location.href = window.location.origin + '/upgrade/' + encodeURIComponent(database._id);
    };
    document.getElementById('settings_upgrade_link').onclick = function () {
        mixpanel.track('Clicked Settings Upgrade Button');
        window.location.href = window.location.origin + '/upgrade/' + encodeURIComponent(database._id);
    };

    document.getElementById('ip_input').addEventListener('keypress', function (e) {
        var key = e.which || e.keyCode;
        if (key === 13) { // 13 is enter
            // code for enter
            var ip = document.getElementById('ip_input').value;

            //check valid
            mixpanel.track('Added IP to Whitelist');
            $.ajax({
                type: "POST",
                url: '/api/db/' + encodeURIComponent(database._id) + '/white_list?ip=' + encodeURIComponent(ip),
                success: function (data) {
                    //insert IP
                    addWhitelistIPElement(ip);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    //notify error!
                    console.log(jqXHR.responseText);

                    if (jqXHR.status == 403) location.reload();

                    var json = JSON.parse(jqXHR.responseText);
                    showError(json.message);
                }
            });
        }
    });

    document.getElementById('add_my_ip').onclick = function () {
        getPublicIP(function (err, ip) {
            if (err)return;
            // console.log(ip);
            addIPToWhitelist(ip + '/32');
        });
    };

    database.white_list.forEach(function (ip) {
        addWhitelistIPElement(ip)
    });
}

function addWhitelistIPElement(ip) {
    var ip_template = document.getElementsByClassName('ip_template')[0].cloneNode(true);
    ip_template.getElementsByClassName('ip')[0].innerText = ip;
    ip_template.style.display = '';
    ip_template.getElementsByClassName('ip_delete')[0].onclick = function () {
        $.ajax({
            type: "DELETE",
            url: '/api/db/' + encodeURIComponent(database._id) + '/white_list?ip=' + encodeURIComponent(ip),
            success: function (data) {
                //hide IP
                ip_template.style.display = 'none';
                console.log('DELETED IP ' + ip);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                //notify error!
                console.log(jqXHR.responseText);
                var json = JSON.parse(jqXHR.responseText);
                if (jqXHR.status == 403) location.reload();

                var json = JSON.parse(jqXHR.responseText);
                showError(json.message);
            }
        });
    };
    document.getElementById('ip_list').appendChild(ip_template);
}

function switchTabs(tab_id) {
    Array.prototype.slice.call(document.getElementById('tabs_content_container').children).forEach(function (tab) {
        console.log(tab_id + ' : ' + tab.id);
        if (tab_id == tab.id) {
            mixpanel.track('Viewed ' + tab_id);
            tab.style.display = '';
            if (tab_id == 'monitoring_tab') {
                //draw cached stats
                showStats(cached_stats, cached_skip_interval, cached_metric_name);
                skip_counter = 0;
            }
        }
        else tab.style.display = 'none';
    });
}


function showStats(stats, skip_interval, metric) {

    // var stats_list = document.getElementById('stats');
    // while (stats_list.hasChildNodes()) {
    //     stats_list.removeChild(stats_list.lastChild);
    // }
    cached_skip_interval = skip_interval; //move
    // console.log('SKIP INTERVAL:' + skip_interval);
    skip_counter = 0;

    var seriesData = {
        series: [
            {
                name: 'series-1',
                data: [
                    {x: new Date(143134652600), y: 53},
                    {x: new Date(143234652600), y: 40},
                    {x: new Date(143340052600), y: 45},
                    {x: new Date(143366652600), y: 40},
                    {x: new Date(143410652600), y: 20},
                    {x: new Date(143508652600), y: 32},
                    {x: new Date(143569652600), y: 18},
                    {x: new Date(143579652600), y: 11}
                ]
            }
        ]
    };

    var options = {
        lineSmooth: Chartist.Interpolation.simple({
            divisor: 2
        }),
        axisX: {
            type: Chartist.FixedScaleAxis,
            divisor: 5,
            labelInterpolationFnc: function (value) {
                //account for delta sec
                if (cached_delta_sec <= 360)return moment(value).format('h:mm');
                else if (cached_delta_sec <= 21600)return moment(value).format('h:mm');
                else if (cached_delta_sec <= 86400)return moment(value).format('h:mm');
                else if (cached_delta_sec <= 172800)return moment(value).format('ddd, hA');
                else if (cached_delta_sec <= 604800)return moment(value).format('ddd, hA');
                else if (cached_delta_sec <= 2419200)return moment(value).format('M/D  hA');
                else if (cached_delta_sec <= 7257600)return moment(value).format('M/D  hA');
                else if (cached_delta_sec <= 14515200)return moment(value).format('M/D  hA');
            }
        },
        showArea: true,
        // height: 300
        low: 0,
        axisY: {
            onlyInteger: true,
            offset: 60,
            labelInterpolationFnc: function (value, index) {
                //customize this for metric type and units!
                return value;
            }

        }
    };
    //
    if (!stats) {
        console.error('Stats were null!');
        return;
    }

    //clear current seriesst
    while (seriesData.series[0].data.length > 0) {
        seriesData.series[0].data.pop();
    }

    var formattedText;

    //then load for this stat, in every satat
    stats.forEach(function (stat) {
        if (!metric)return;
        seriesData.series[0].data.push({x: new Date(stat.time_stamp), y: stat[metric]});

        if (metric.includes('bytes') && metric.includes('sec')) {
            options.axisY.labelInterpolationFnc = function (value, index) {
                var thresh = 1024;
                if (Math.abs(value) < thresh) {
                    return value + ' B/sec';
                }
                var units = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
                var us = -1;
                do {
                    value /= thresh;
                    ++us;
                } while (Math.abs(value) >= thresh && us < units.length - 1);
                var formatted = value.toFixed(1) + ' ' + units[us] + '/sec';
                formattedText = formatted;
                return formatted;
            }
        } else if (metric.includes('sec')) {
            options.axisY.labelInterpolationFnc = function (value, index) {
                var thresh = 1000;
                if (Math.abs(value) < thresh) {
                    return value + '/sec';
                }
                var units = ['K', 'M', 'B', 'T'];
                var us = -1;
                do {
                    value /= thresh;
                    ++us;
                } while (Math.abs(value) >= thresh && us < units.length - 1);
                var formatted = value.toFixed(1) + ' ' + units[us] + '/sec';
                formattedText = formatted;
                return formatted;
            }
        } else if (metric.includes('bytes')) {
            options.axisY.labelInterpolationFnc = function (value, index) {
                var thresh = 1024;
                if (Math.abs(value) < thresh) {
                    return value + 'B';
                }
                var units = ['KB', 'MB', 'GB', 'TB'];
                var us = -1;
                do {
                    value /= thresh;
                    ++us;
                } while (Math.abs(value) >= thresh && us < units.length - 1);
                var formatted = value.toFixed(1) + ' ' + units[us];
                formattedText = formatted;
                return formatted;
            }
        } else {
            options.axisY.labelInterpolationFnc = function (value, index) {
                var thresh = 1000;
                if (Math.abs(value) < thresh) {
                    return value;
                }
                var units = ['K', 'M', 'B', 'T'];
                var us = -1;
                do {
                    value /= thresh;
                    ++us;
                } while (Math.abs(value) >= thresh && us < units.length - 1);
                var formatted = value.toFixed(1) + ' ' + units[us];
                formattedText = formatted;
                return formatted;
            }
        }
    });


    seriesData.series[0].data.reverse();

    //set metric value text to formatted text
    console.log(metric);
    console.log(metric);
    if (stats.length > 0) {
        document.getElementById('metric_value').style.display = ''
        document.getElementById('metric_value').innerText = getStatsText(metric, stats[0][metric]);
    }

    //display the chart
    // var newChart = document.getElementsByClassName('stat_template')[0];
    // newChart.getElementsByClassName('metric_name')[0].innerHTML = metric;
    var chart = new Chartist.Line(document.getElementsByClassName('chart')[0], seriesData, options);

    //hide progress
    document.getElementById('stats_progress').style.display = 'none';

    //opacity
    document.getElementsByClassName('chart')[0].style.opacity = '1';
}

var retries = 0;
function setWSCallbacks() {
    //Shell

    /*var buff = '';
     shellWs.onmessage = function (packet) {
     console.log(packet.data);
     buff += packet.data;
     if (buff.charAt(buff.length - 1) == '\n' || buff.toString('utf-8').includes('>')) {
     // console.log(buff);
     //log command
     pushShellLine(buff.toString('utf-8'));
     buff = '';
     }
     };

     shellWs.onerror = function (error) {
     console.log("ShellWS error!");
     console.error(error);

     showError(error.message);
     };

     shellWs.onopen = function () {
     console.log("ShellWS OPEN!");
     };

     shellWs.onclose = function () {
     pushShellLine('---SHELL DISCONNECTED---')
     };*/

    //Stats
    ws.onopen = function () {
        console.log("WS Opened");
        onWsInit();
    };

    ws.onmessage = function (json) {
        // console.log('WS Got raw :' + json.data);
        var packet = JSON.parse(json.data);
        // console.log(JSON.stringify(packet, undefined, 2));
        //handle query responses, divert
        onWsMessage(packet);
    };

    ws.onerror = function (error) {
        console.log("WS error!");
        console.error(error);
    };

    ws.onclose = function () {
        console.log('WS CLOSED');
        var delayMS = 500;

        //handle reconnect loop
        if (retries == 100) {//give up

            showError("Gave up trying to connect after " + retries + " retries (" + ((delayMS * 200) / 1000) + "sec)");
            return;
        }
        console.log("WS CLOSED! Attempting to reconnect in " + delayMS + "ms..."); //to stop accidental spam
        setTimeout(function () {
            console.log("Reconnecting...");
            var url = 'ws://' + window.location.hostname + ':' + window.location.port + '/api/monitoring/db?db_id=' + database._id + '&api_key=' + getMeta('api_key')
            if (!window.location.href.includes('localhost')) {
                url = 'wss://' + window.location.hostname + '/api/monitoring/db?db_id=' + database._id + '&api_key=' + getMeta('api_key')
            }
            ws = new WebSocket(url);
            setWSCallbacks();
            retries++;
        }, delayMS);
    };

}

function onWsMessage(packet) {
    if (!packet)return;
    if (!packet.event && !packet.error) {
        console.error('No event or err for packet!: ' + JSON.stringify(packet));
        return;
    }

    switch (packet.event) {
        case 'GET_STATS': {
            skip_counter = 0;
            console.log('GOT ' + packet.stats.length + ' STATS!');
            cached_stats = packet.stats;
            // console.log(JSON.stringify(packet, undefined, 2));
            showStats(packet.stats, packet.skip_interval, cached_metric_name);


            break;
        }

        case 'GET_TOPOLOGY': {
            skip_counter = 0;
            console.log('GOT TOPOLOGY!');
            showTopology(packet.topology);
            // console.log(JSON.stringify(packet, undefined, 2));
            break;
        }

        case 'TOPOLOGY_UPDATE': {
            console.log('GOT TOPOLOGY UPDATE!');
            showTopology(packet.topology);
            // console.log(JSON.stringify(packet, undefined, 2));
            break;
        }

        case 'UPGRADE_UPDATE': {
            console.log('GOT UPGRADE UPDATE!');

            document.getElementById('upgrade_container').style.display = '';
            document.getElementById('upgrade_button').style.display = 'none';
            if (packet.message == 'DONE') {
                document.getElementById('upgrade_container').style.display = 'none';
                document.getElementById('upgrade_button').style.display = '';
            } else if (packet.message == 'ERROR') {
                document.getElementById('upgrade_container').style.display = 'none';
                document.getElementById('upgrade_button').style.display = '';
                showError('Upgrade error!:\n' + packet.error);
            } else {
                document.getElementById('upgrade_text').innerText = packet.message;
            }
            break;
        }

        case 'SNAPSHOT_UPDATE': {
            console.log('GOT SNAPSHOT UPDATE!!!');
            console.log(packet);
            updateSnapshot(packet._id, packet.progress);

            try {
                document.getElementById('upgrade_button').style.display = 'none';
                if (packet.progress == '100%') {
                    console.log('SCOVERRIDE');
                    document.getElementById('upgrade_container').style.display = 'none';
                    document.getElementById('upgrade_button').style.display = '';
                } else {
                    document.getElementById('upgrade_container').style.display = '';
                    document.getElementById('upgrade_text').innerText = 'Snapshotting DB';
                }

            } catch (e) {
                console.error(e);
            }
            break;
        }

        case 'STATS_UPDATE': {
            console.log('GOT STATS UPDATE!');
            if (!cached_stats) {
                console.log('No cached stats!')
                return;
            }

            if (skip_counter == cached_skip_interval) {
                console.log('adding stat');
                if (cached_stats.length >= 4) { //wait for inital history to stack up to at least 4 before popping old stats off the cached array
                    cached_stats.pop();
                }
                cached_stats.unshift(packet.stat);
                showStats(cached_stats, cached_skip_interval, cached_metric_name);
                skip_counter = 0;
            } else {
                console.log('skipped');
                skip_counter++;
            }
            // console.log('Skipped ' + skip_counter + ' of ' + cached_skip_interval);

            break;
        }
    }
}

function onWsInit() {
    //init
    ws.send(JSON.stringify({event: 'GET_STATS', delta_sec: 60}));
    ws.send(JSON.stringify({event: 'GET_TOPOLOGY'}));
}

function getMeta(property) {
    var metas = document.getElementsByTagName('meta');
    for (var i = 0; i < metas.length; i++) {
        if (metas[i].getAttribute("property") == property) {
            return metas[i].getAttribute("content");
        }
    }
    return null;
}

function getShellString(database) {
    if (database.type.includes('REPLICA')) {
        var hosts = 'rs0/';

        var a = 0;
        database.instances.forEach(function (instance) {
            hosts += database._id + a + '.dbgrow.com:27017';
            if (a != database.instances.length - 1) {
                hosts += ',';
            }
            a++;
        });
        return 'mongo --host ' + hosts + ' --username dbgrowadmin --password [your password] --ssl --sslAllowInvalidHostnames --authenticationDatabase ' + database._id
    } else {
        return 'mongo --host ' + database._id + '0.dbgrow.com:27017' + ' --username dbgrowadmin --password [your password] --ssl --sslAllowInvalidHostnames  --authenticationDatabase ' + database._id
    }
}

function getConnectionURI(database) {
    if (database.type.includes('REPLICA')) {
        var hosts = '';

        var a = 0;
        database.instances.forEach(function (instance) {
            hosts += database._id + a + '.dbgrow.com:27017';
            if (a != database.instances.length - 1) {
                hosts += ',';
            }
            a++;
        });
        return "mongodb://dbgrowadmin:[your password]@" + hosts + "/" + database._id + "?replicaSet=rs0&ssl=true&sslAllowInvalidHostnames=true&authMechanism=SCRAM-SHA-1"
    } else if (database.type.includes('SHARED')) {
        return "mongodb://dbgrowadmin:[your password]@" + database.shared_db_id + '.dbgrow.com:27017' + "/" + database._id + "?ssl=true&sslAllowInvalidHostnames=true&authMechanism=SCRAM-SHA-1";
    } else {
        return "mongodb://dbgrowadmin:[your password]@" + database._id + '0.dbgrow.com:27017' + "/" + database._id + "?ssl=true&sslAllowInvalidHostnames=true&authMechanism=SCRAM-SHA-1";
    }
}

function getNodeString(database) {
    return "var MongoClient = require('mongodb').MongoClient;\n"
        + "MongoClient.connect('" + getConnectionURI(database) + "',\n" +
        "function (err, db_connection){\n"
        + '\tif(err) throw err;\n'
        + '\t//DB operations here!\n'
        + '});'
}

function getPythonString(database) {
    return "from pymongo import MongoClient\n"
        + "client = MongoClient('" + getConnectionURI(database) + "')"
}

function getJavaString(database) {
    return 'MongoClient mongoClient = MongoClients.create("' + getConnectionURI(database) + '");'
}

function getSnapshotElement(snapshot) {
    var clone = document.getElementsByClassName('snapshot_template')[0].cloneNode(true);
    clone.setAttribute('data-snapshot-id', snapshot._id);

    clone.style.display = '';
    clone.getElementsByClassName('snapshot_date')[0].innerText = moment(snapshot.created).format('M/D/YY H:mm');
    clone.getElementsByClassName('snapshot_gb')[0].innerText = '(' + snapshot.size + ' GB)';
    clone.getElementsByClassName('snapshot_restore')[0].onclick = function () {
        document.getElementById('restoremodal').style.display = 'inline-block';
        document.getElementById('restore_close').onclick = function () {
            document.getElementById('restoremodal').style.display = 'none';
        }
        document.getElementById('restore_button').onclick = function () {
            document.getElementById('restoremodal').style.display = 'none';
            restoreSnapshot(clone.getAttribute('data-snapshot-id'), function (err) {
                if (err) {
                    console.error(err);
                    return;
                }

                document.getElementById('upgrade_button').style.display = 'none';
                document.getElementById('upgrade_container').style.display = '';
                document.getElementById('upgrade_text').innerText = 'Restoring Database';
            });
        };
    };
    clone.getElementsByClassName('snapshot_download')[0].onclick = function () {

        saveSnapshot(clone.getAttribute('data-snapshot-id'), function (err, saved_snapshot) {
            if (err) {
                return;
            }

            //put new snapshot HTML in exported snapshots list
            var snap_element = getSavedSnapshotElement(saved_snapshot);
            document.getElementById('saved_snapshots').appendChild(snap_element);
        });
    };

    clone.getElementsByClassName('snapshot_delete')[0].onclick = function () {
        //Copy over Snapshot to AWS account
        deleteSnapshot(clone.getAttribute('data-snapshot-id'), function (err, snapshot) {
            if (err) {
                //show error notification!
                return;
            }

            //hide the snapshot
            clone.style.display = 'none';
        });
    };
    return clone;
}

function getSavedSnapshotElement(snapshot) {
    var clone = document.getElementsByClassName('saved_snapshot_template')[0].cloneNode(true);
    clone.setAttribute('data-snapshot-id', snapshot._id);

    clone.style.display = '';
    clone.getElementsByClassName('snapshot_date')[0].innerText = moment(snapshot.created).format('M/D/YY H:mm');
    clone.getElementsByClassName('snapshot_gb')[0].innerText = '(' + snapshot.size + ' GB)';
    clone.getElementsByClassName('snapshot_restore')[0].onclick = function () {
        document.getElementById('restoremodal').style.display = 'inline-block';
        document.getElementById('restore_close').onclick = function () {
            document.getElementById('restoremodal').style.display = 'none';
        }
        document.getElementById('restore_button').onclick = function () {
            document.getElementById('restoremodal').style.display = 'none';
            restoreSnapshot(clone.getAttribute('data-snapshot-id'), function (err) {
                if (err) {
                    console.error(err);
                    return;
                }

                document.getElementById('upgrade_button').style.display = 'none';
                document.getElementById('upgrade_container').style.display = '';
                document.getElementById('upgrade_text').innerText = 'Restoring Database';
            });
        };
    };
    clone.getElementsByClassName('snapshot_export')[0].onclick = function () {
        //Copy over Snapshot to AWS account
        //show dialog
        console.log('EXPORT');
        document.getElementById('exportmodal').style.display = 'inline-block';

        document.getElementById('export_snapshot_button').onclick = function () {
            var aws_id = document.getElementById('export_aws_id').value;
            //check if valid
            document.getElementById('exportmodal').style.display = 'none';

            exportSnapshot(clone.getAttribute('data-snapshot-id'), aws_id, function (err) {
                if (err) {
                    return;
                }

                //put new snapshot HTML in exported snapshots list
            })
        };

        document.getElementById('export_snapshot_close').onclick = function () {
            document.getElementById('exportmodal').style.display = 'none';
        };
    };

    clone.getElementsByClassName('snapshot_delete')[0].onclick = function () {
        //Copy over Snapshot to AWS account
        console.log(clone.getAttribute('data-snapshot-id'));
        deleteSnapshot(clone.getAttribute('data-snapshot-id'), function (err, snapshot) {
            if (err) {
                //show error notification!
                return;
            }
            console.log('Deleted Snap!');

            //hide the snapshot
            clone.style.display = 'none';
        });
    };
    return clone;
}

function updateSnapshot(id, progress) {
    var snapshots = document.getElementById('snapshots');
    Array.prototype.slice.call(snapshots.children).forEach(function (snapshot) {
        if (snapshot.getAttribute('data-snapshot-id') == id) {
            //check progress
            if (progress != '100%') {
                snapshot.getElementsByClassName('progress')[0].style.display = '';
                snapshot.getElementsByClassName('progress')[0].innerText = progress;
                snapshot.getElementsByClassName('buttons')[0].style.display = 'none';
            } else {
                snapshot.getElementsByClassName('progress')[0].style.display = 'none';
                snapshot.getElementsByClassName('buttons')[0].style.display = '';
            }
        }
    });

    var saved_snapshots = document.getElementById('saved_snapshots');
    Array.prototype.slice.call(saved_snapshots.children).forEach(function (snapshot) {
        if (snapshot.getAttribute('data-snapshot-id') == id) {
            //check progress
            if (progress != '100%') {
                snapshot.getElementsByClassName('progress')[0].style.display = '';
                snapshot.getElementsByClassName('progress')[0].innerText = progress;
                snapshot.getElementsByClassName('buttons')[0].style.display = 'none';
            } else {
                snapshot.getElementsByClassName('progress')[0].style.display = 'none';
                snapshot.getElementsByClassName('buttons')[0].style.display = '';
            }
        }
    });
}

function showTopology(topology) {
    // document.getElementById('db_id').innerHTML = database._id;

    console.log(JSON.stringify(topology, undefined, 2));

    var servers = document.getElementById('servers');
    var totalWidth = 0;

    //clear and reset
    while (servers.hasChildNodes()) {
        servers.removeChild(servers.lastChild);
    }

    topology.sort(function (a, b) {
        if (a.state < b.state)return -1;
        if (a.state > b.state)return 1;
        return 0;
    });

    topology.forEach(function (member) {
        if (member.state == 10)return; //removed

        var serverTemplate = document.getElementById('server_template').cloneNode(true);
        serverTemplate.setAttribute('id', undefined);
        serverTemplate.setAttribute('data-instance-id', member._id);
        serverTemplate.setAttribute('data-public-dns', member.public_dns);
        var type;

        if (topology.length > 1) {
            switch (member.state) {
                case 0:
                    type = 'STARTUP';
                    break;
                case 1:
                    type = 'PRIMARY';
                    break;
                case 2:
                    type = 'SECONDARY';
                    break;
                case 3:
                    type = 'RECOVERING';
                    break;
                case 5:
                    type = 'SYNC';
                    break;
                case 6:
                    type = 'UNKNOWN';
                    break;
                case 8:
                    type = 'DOWN';
                    break;
                case 9:
                    type = 'ROLLBACK';
                    break;
                default:
                    type = '-';
            }
        } else {
            if (member.size == 0) {
                type = 'SHARED';
            } else {
                type = 'STANDALONE';
            }
        }

        serverTemplate.getElementsByClassName('server_type')[0].innerHTML = type;

        var ram = '- ';
        if (!database.type.includes('SHARED')) {
            switch (member.size) {
                case 't2.nano': {
                    ram = '0.5';
                    break
                }

                case 't2.micro': {
                    ram = '1';
                    break
                }

                case 't2.small': {
                    ram = '2';
                    break
                }

                case 't2.medium': {
                    ram = '4';
                    break
                }

                case 'm4.large': {
                    ram = '8';
                    break
                }

                case 'm4.xlarge': {
                    ram = '16';
                    break
                }

                case 'm4.2xlarge': {
                    ram = '32';
                    break
                }

                case 'm4.4xlarge': {
                    ram = '64';
                    break
                }
                //etc
            }
        }

        serverTemplate.getElementsByClassName('ram')[0].innerHTML = ram + 'GB RAM';
        serverTemplate.getElementsByClassName('region')[0].innerHTML = member.availability_zone;

        //soon we'll differentiate these using animations and better (non rasta) colors
        switch (member.state) {
            case 0:
                serverTemplate.style.borderColor = '#efe100'
                break;
            case 1:
                serverTemplate.style.borderColor = '#4EA93F'
                break;
            case 2:
                serverTemplate.style.borderColor = '#4EA93F'
                break;
            case 3:
                serverTemplate.style.borderColor = '#efe100'
                break;
            case 5:
                serverTemplate.style.borderColor = '#efe100'
                break;
            case 6:
                serverTemplate.style.borderColor = '#888888'
                break;
            case 8:
                serverTemplate.style.borderColor = '#ef0014';
                break;
            case 9:
                serverTemplate.style.borderColor = '#efe100'
                break;
            default:
                type = '-';
        }

        serverTemplate.style.display = 'inline-block';
        servers.appendChild(serverTemplate);
        totalWidth += serverTemplate.offsetWidth + 25;
    });

    //calculate final size for templates layout
    servers.style.width = totalWidth + 'px';
}

function showUsers(database) {

}

function pushShellLine(text) {
    /*text = text.replace('>', '');
     // text = text.replace('>\n', '');
     // text = text.trim();*/

    if (text.includes('&#62;')) {
        var div = document.createElement('div');
        div.innerHTML = "<div style=\"color: #63ef52\">" + text + "</div>"; //green not working!!!
        document.getElementById('shell_list').innerHTML += '<br> ' + div.innerHTML;
    } else {
        document.getElementById('shell_list').innerText += text;
    }

    //scroll to bottom
    document.getElementById('ovr').scrollTop = document.getElementById('ovr').scrollHeight;
}

function getDatabase(db_id, callback) {
    $.ajax({
        type: "GET",
        url: '/api/db/' + encodeURIComponent(db_id),
        success: function (data) {
            callback(undefined, data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //notify error!
            console.log(jqXHR.responseText);
            var json = $.parseJSON(jqXHR.responseText);
            console.log(json);
            callback(json);

            if (jqXHR.status == 403) location.reload();

            var json = JSON.parse(jqXHR.responseText);
            showError(json.message);
        }
    });
}

function deleteSnapshot(id, callback) {
    console.log('going!');
    $.ajax({
        type: "DELETE",
        url: '/api/db/' + encodeURIComponent(database._id) + '/snapshot/' + encodeURIComponent(id),
        success: function (data) {
            console.log('Success!');
            callback(undefined, data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //notify error!
            console.log('err!');
            var json = $.parseJSON(jqXHR.responseText);
            console.log(json);
            callback(json);

            if (jqXHR.status == 403) location.reload();

            var json = JSON.parse(jqXHR.responseText);
            showError(json.message);
        }
    });
}

function saveSnapshot(id, callback) {
    $.ajax({
        type: "POST",
        url: '/api/db/' + encodeURIComponent(database._id) + '/snapshot/' + encodeURIComponent(id) + '/save',
        success: function (data) {
            callback(undefined, data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //notify error!
            var json = $.parseJSON(jqXHR.responseText);
            console.log(json);
            callback(json);

            if (jqXHR.status == 403) location.reload();

            var json = JSON.parse(jqXHR.responseText);
            showError(json.message);
        }
    });
}

function exportSnapshot(id, aws_id, callback) {
    $.ajax({
        type: "POST",
        url: '/api/db/' + encodeURIComponent(database._id) + '/snapshot/' + encodeURIComponent(id) + '/export?aws_id=' + encodeURIComponent(aws_id),
        success: function (data) {
            callback(undefined, data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //notify error!
            var json = $.parseJSON(jqXHR.responseText);
            console.log(json);
            callback(json);

            if (jqXHR.status == 403) location.reload();

            var json = JSON.parse(jqXHR.responseText);
            showError(json.message);
        }
    });
}

function restoreSnapshot(id, callback) {
    $.ajax({
        type: "POST",
        url: '/api/db/' + encodeURIComponent(database._id) + '/snapshot/' + encodeURIComponent(id) + '/revive',
        success: function (data) {
            callback(undefined, data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //notify error!
            var json = $.parseJSON(jqXHR.responseText);
            console.log(json);
            callback(json);

            if (jqXHR.status == 403) location.reload();

            var json = JSON.parse(jqXHR.responseText);
            showError(json.message);
        }
    });
}


var excluded_shared_metrics = [
    'ram_used_bytes',
    'ram_allocated_bytes',
    'connections',
    'available_connections',
    'page_faults',
    'available_read_tickets',
    'available_write_tickets',
    'queued_writes',
    'queued_reads',
    'replication_lag_ms',
    'query_sec',
    'insert_sec',
    'update_sec',
    'delete_sec'
];
var excluded_standalone_metrics = [
    'replication_lag_ms'
];

function createSnapshot(callback) {
    console.log('/api/db/' + encodeURIComponent(database._id) + '/snapshots');
    $.ajax({
        type: "POST",
        url: '/api/db/' + encodeURIComponent(database._id) + '/snapshots',
        success: function (data) {
            callback(undefined, data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //notify error!
            var json = $.parseJSON(jqXHR.responseText);
            console.log(json);
            callback(json);
            if (jqXHR.status == 403) location.reload();

            var json = JSON.parse(jqXHR.responseText);
            showError(json.message);
        }
    });
}


function calculateShownMetrics() {

    //blip then hide metrics
    showAllMetrics();
    Array.prototype.slice.call(stats_menu.children).forEach(function (item) {
        if (database.type == 'STANDALONE') {
            if (excluded_standalone_metrics.includes(item.getAttribute('data-metric'))) item.style.display = 'none';
        } else if (database.type == 'SHARED_STANDALONE') {
            if (excluded_shared_metrics.includes(item.getAttribute('data-metric'))) item.style.display = 'none';
        } else { //rs
            //all shown already!,
        }
    });

    //check to see if currently cached metric is currently allowed!
    //if not flip to another metric
}

function showAllMetrics() {
    Array.prototype.slice.call(stats_menu.children).forEach(function (item) {
        item.style.display = '';
    });
}

function getPublicIP(callback) {
    $.ajax({
        type: "GET",
        url: 'https://api.ipify.org/?format=json',
        success: function (data) {
            callback(undefined, data.ip);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //notify error!
            console.log(jqXHR.responseText);
            callback(jqXHR);

            if (jqXHR.status == 403) location.reload();

            var json = JSON.parse(jqXHR.responseText);
            showError(json.message);
        }
    });
}

function addIPToWhitelist(ip) {
    //progress!
    $.ajax({
        type: "POST",
        url: '/api/db/' + encodeURIComponent(database._id) + '/white_list?ip=' + encodeURIComponent(ip),
        success: function (data) {
            //insert IP
            addWhitelistIPElement(ip);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //notify error!
            console.log(jqXHR.responseText);
            var json = JSON.parse(jqXHR.responseText);
            if (jqXHR.status == 403) location.reload();

            var json = JSON.parse(jqXHR.responseText);
            showError(json.message);
        }
    });
}

function getCustomer(callback) {
    $.ajax({
        type: "GET",
        url: '/internal/customer',
        success: function (customer) {
            console.log(customer);
            //check status code
            // var a = JSON.parse(data);
            callback(undefined, customer);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //notify error!
            // console.log(jqXHR);
            console.error('ERR');
            callback(jqXHR);
            if (jqXHR.status == 403) location.reload();

            var json = JSON.parse(jqXHR.responseText);
            showError(json.message);
        }
    });
}

function showError(text) {
    document.getElementById('errormodal').style.display = 'inline-block';

    try {
        document.getElementById('error_message').innerText = JSON.stringify(text, undefined, 2);
    } catch (e) {
        console.error(e);
        document.getElementById('error_message').innerText = text;
    }
}

function acknowledgeTempPassword(callback) {
    $.ajax({
        type: "DELETE",
        url: '/api/db/' + database._id + '/temp_password',
        success: function (customer) {
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //notify error!
            // console.log(jqXHR);
            console.error('ERR');
            if (callback) callback(jqXHR);
            if (jqXHR.status == 403) location.reload();

            var json = JSON.parse(jqXHR.responseText);
            showError(json.message);
        }
    });
}

function getStatsText(metric, value) {
    if (metric.includes('bytes') && metric.includes('sec')) {

        var thresh = 1024;
        if (Math.abs(value) < thresh) {
            return value + ' B/sec';
        }
        var units = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var us = -1;
        do {
            value /= thresh;
            ++us;
        } while (Math.abs(value) >= thresh && us < units.length - 1);
        var formatted = value.toFixed(1) + ' ' + units[us] + '/sec';
        formattedText = formatted;
        return formatted;

    } else if (metric.includes('sec')) {

        var thresh = 1000;
        if (Math.abs(value) < thresh) {
            return value + '/sec';
        }
        var units = ['K', 'M', 'B', 'T'];
        var us = -1;
        do {
            value /= thresh;
            ++us;
        } while (Math.abs(value) >= thresh && us < units.length - 1);
        var formatted = value.toFixed(1) + ' ' + units[us] + '/sec';
        formattedText = formatted;


    } else if (metric.includes('bytes')) {

        var thresh = 1024;
        if (Math.abs(value) < thresh) {
            return value + 'B';
        }
        var units = ['KB', 'MB', 'GB', 'TB'];
        var us = -1;
        do {
            value /= thresh;
            ++us;
        } while (Math.abs(value) >= thresh && us < units.length - 1);
        var formatted = value.toFixed(1) + ' ' + units[us];
        formattedText = formatted;
        return formatted;

    } else {

        var thresh = 1000;
        if (Math.abs(value) < thresh) {
            return value;
        }
        var units = ['K', 'M', 'B', 'T'];
        var us = -1;
        do {
            value /= thresh;
            ++us;
        } while (Math.abs(value) >= thresh && us < units.length - 1);
        var formatted = value.toFixed(1) + ' ' + units[us];
        formattedText = formatted;
        return formatted;
    }

}