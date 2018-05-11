//elements
var fields;
var progress;

var db_name_valid = false;
var db_name;
var ram = '0.5GB'; //0 is actually 0.5(shared)!!!
var region = 'us-west-2'; //BECAUSE IT's CHEAP. Could probably come up with something better
var region_1; //BECAUSE IT's CHEAP. Could probably come up with something better
var region_2; //BECAUSE IT's CHEAP. Could probably come up with something better
var count = 3;

var db_type = 'Shared'; //init shared
var cached_customer;

var jquery_fields;

var regions;

var rs_template;
var standalone_template;
var shared_template;
var name_template;
var summary_template;

var checkout_rs = false;
var rs_selected_region = 'us-west-2';
var rs_selected_ram = '0.5GB';
var region_counts;


var name_slide_added = false;
document.addEventListener("DOMContentLoaded", function (event) {
    mixpanel.track('Viewed Create Database Page');

    fields = document.getElementById('fields');
    progress = document.getElementById('progress');

    rs_template = document.getElementById('replica_set_template').cloneNode(true);
    rs_template.setAttribute('id', undefined);
    rs_template.style.display = '';
    registerRAMMenu(rs_template.getElementsByClassName('ram')[0], rs_template.getElementsByClassName('ram_text')[0], 0, function (selected_ram) {
        rs_selected_ram = selected_ram;
        summary_template.getElementsByClassName('confirm_ram_text')[0].innerText = selected_ram;

        Array.prototype.slice.call(rs_template.getElementsByClassName('nodes')[0].children).forEach(function (child) {
            child.getElementsByClassName('node_ram')[0].innerText = selected_ram;
        });

        recalculatePricing();
    });

    /*registerMembersMenu(rs_template.getElementsByClassName('members')[0], rs_template.getElementsByClassName('members_text')[0], false, function (members) {
     count = members;
     });*/


    registerRegionMenu(rs_template.getElementsByClassName('region')[0], rs_template.getElementsByClassName('region_text')[0], function (selected_region) {
        rs_selected_region = selected_region;
    })

    rs_template.getElementsByClassName('add_node')[0].onclick = function () {
        mixpanel.track('Added Create DB Pricing Node');
        addNode(rs_selected_region, ram);
    };

    standalone_template = document.getElementById('standalone_template').cloneNode(true);
    standalone_template.setAttribute('id', undefined);
    standalone_template.style.display = '';
    registerRAMMenu(standalone_template.getElementsByClassName('ram')[0], standalone_template.getElementsByClassName('ram_text')[0], 0, function (selected_ram) {
        //alert('picked RAM ' + ram);
        rs_selected_ram = selected_ram;
        summary_template.getElementsByClassName('confirm_ram_text')[0].innerText = selected_ram;

        Array.prototype.slice.call(standalone_template.getElementsByClassName('ram_rec')).forEach(function (rec) {
            var translated_size;
            if (ram.includes('64GB')) {
                translated_size = 64;
            } else if (ram.includes('32GB')) {
                translated_size = 32;
            } else if (ram.includes('16GB')) {
                translated_size = 16;
            } else if (ram.includes('8GB')) {
                translated_size = 8;
            } else if (ram.includes('4GB')) {
                translated_size = 4;
            } else if (ram.includes('2GB')) {
                translated_size = 2;
            } else if (ram.includes('1GB')) {
                translated_size = 1;
            } else if (ram.includes('0.5GB')) {
                translated_size = 0.5;
            }

            rec.innerText = translated_size * 4 + 'GB'
        });
    });
    registerRegionMenu(standalone_template.getElementsByClassName('region')[0], standalone_template.getElementsByClassName('region_text')[0], function (selected_region) {
        region = selected_region;
    });

    shared_template = document.getElementById('shared_template').cloneNode(true);
    shared_template.setAttribute('id', undefined);
    shared_template.style.display = '';
    registerRegionMenu(shared_template.getElementsByClassName('region')[0], shared_template.getElementsByClassName('region_text')[0], function (selected_region) {
        region = selected_region;
    });

    summary_template = document.getElementById('summary_template').cloneNode(true);
    summary_template.setAttribute('id', undefined);
    summary_template.style.display = '';

    jquery_fields = $('#fields');
    jquery_fields.slick({
        swipe: false,
        arrows: false,
    });

    //onclicks for buttons
    document.getElementById('shared_button').onclick = function () {
        //add slide, advance
        mixpanel.track('Selected Create DB Shared DB');
        jquery_fields.slick('slickAdd', shared_template);
        db_type = 'Shared';
        summary_template.getElementsByClassName('confirm_ram_text')[0].innerText = 'Shared';
        advance();
    }

    //onclicks for buttons
    document.getElementById('standalone_button').onclick = function () {
        //add slide, advance
        mixpanel.track('Selected Create DB Standalone DB');
        jquery_fields.slick('slickAdd', standalone_template);
        summary_template.getElementsByClassName('confirm_ram_text')[0].innerText = '0.5GB';
        db_type = 'Standalone';
        advance();
    }

    //onclicks for buttons
    document.getElementById('rs_button').onclick = function () {
        //add slide, advance
        mixpanel.track('Selected Create DB RS DB');

        jquery_fields.slick('slickAdd', rs_template);
        summary_template.getElementsByClassName('confirm_ram_text')[0].innerText = '0.5GB';
        db_type = 'Replica Set';
        checkout_rs = true;
        advance();
    };

    //check DB name
    name_template = document.getElementById('name_template').cloneNode(true);
    name_template.setAttribute('id', undefined);
    name_template.style.display = '';
    var search_form = name_template.getElementsByClassName('search-form')[0];
    var search_text = name_template.getElementsByClassName('search-text')[0];
    search_text.onkeyup = function () {
        var val = search_text.value
        db_name = val;
        console.log('Checking ' + val);
        name_template.getElementsByClassName('db_name')[0].innerText = val;
        summary_template.getElementsByClassName('db_name')[0].innerText = val;
        if (val.length == 0 || !val) {
            search_form.style.border = '2px solid #999;';
            db_name_valid = false;
        } else if (val.length >= 3) {
            checkDBName(val, function (exists) {
                if (exists) {
                    name_template.getElementsByClassName('search-form')[0].style.border = '2px solid red';
                    document.getElementById('next_button').style.opacity = '0.5';
                    db_name_valid = false;

                    name_template.getElementsByClassName('db_name')[0].innerText = '[name]';
                } else {
                    name_template.getElementsByClassName('search-form')[0].style.border = '2px solid #63ef52';
                    document.getElementById('next_button').style.opacity = '1';
                    db_name_valid = true;
                }
            })
        } else {
            name_template.getElementsByClassName('search-form')[0].style.border = '2px solid red';
            document.getElementById('next_button').style.opacity = '0.5';
            db_name_valid = false;
        }
    };


    //set cust name
    getCustomer(function (err, customer) {
        if (err)return;

        cached_customer = customer;

        if (customer.name) {
            document.getElementById('account_name').innerText = customer.name;
        } else {
            document.getElementById('account_name').innerText = customer.email;
        }

        if (customer.free_lock) {
            document.getElementById('rs_button').style.opacity = '0.6';
            document.getElementById('rs_button').onclick = undefined;
            document.getElementById('rs_button').title = 'Please verify your account with support to create a dedicated DB!';

            document.getElementById('standalone_button').style.opacity = '0.6';
            document.getElementById('standalone_button').onclick = undefined;
            document.getElementById('standalone_button').title = 'Please verify your account with support to create a dedicated DB!';
        }
    })

});

function advance() {
    console.log('Current: ' + jquery_fields.slick('slickCurrentSlide'));

    if (jquery_fields.slick('slickCurrentSlide') == 0) {

        //if name is invalid grey out the advance button until the field is finished!
        document.getElementById('next_button').style.display = '';
        document.getElementById('back_button').style.display = '';
        document.getElementById('next_button').style.opacity = '1.0';

        if (rs_template.getElementsByClassName('nodes')[0].children.length == 0) {
            addNode('us-west-2', '0.5GB');
            addNode('us-west-2', '0.5GB');
            addNode('us-west-2', '0.5GB');
        }

        if (!db_type.includes('Replica')) {
            document.getElementById('next_button').style.opacity = '1.0';
        }

        mixpanel.track('Viewed Create DB Region/RAM Slide');
    } else if (jquery_fields.slick('slickCurrentSlide') == 1) {
        //add name slide
        if (!name_slide_added) {
            jquery_fields.slick('slickAdd', name_template);
            name_slide_added = true;
        }
        console.log('ADDED NAME SLIDE')
        mixpanel.track('Viewed Create DB Name Slide');

        document.getElementById('next_button').style.display = '';

        if (!db_name_valid) {
            document.getElementById('next_button').style.opacity = '0.5';
        } else {
            document.getElementById('next_button').style.opacity = '1';
        }
    } else if (jquery_fields.slick('slickCurrentSlide') == 2) {
        if (!db_name_valid) {
            //emphasize invalid db names
            return;
        }


        // computeAWSRegions();
        jquery_fields.slick('slickAdd', summary_template);
        jquery_fields.slick('slickNext');

        mixpanel.track('Viewed Create DB Summary Slide');

        //we're moving to the final slide, hide old button and show new create DB button
        document.getElementById('next_button').style.display = 'none';
        document.getElementById('create_button').style.display = '';

        //enumerate regions
        //calculate costs
        var translated_size;
        if (ram.includes('64GB')) {
            translated_size = 'm4.4xlarge';
        } else if (ram.includes('32GB')) {
            translated_size = 'm4.2xlarge';
        } else if (ram.includes('16GB')) {
            translated_size = 'm4.xlarge';
        } else if (ram.includes('8GB')) {
            translated_size = 'm4.large';
        } else if (ram.includes('4GB')) {
            translated_size = 't2.medium';
        } else if (ram.includes('2GB')) {
            translated_size = 't2.small';
        } else if (ram.includes('1GB')) {
            translated_size = 't2.micro';
        } else if (ram.includes('0.5GB')) {
            translated_size = 't2.nano';
        }

        summary_template.getElementsByClassName('summary_regions')[0].innerText = '';

        var regions = new Set();
        if (region) {
            regions.add(region);
        } else {
            region = 'us-west-2';
            regions.add(region);
        }

        if (region_1) {
            regions.add(region_1);
        }

        if (region_2) {
            regions.add(region_2);
        }

        regions = Array.from(regions);
        console.log(regions);
        if (db_type.includes('Replica')) {
            var added = 0;
            region_counts = {};
            console.log('REGIONS: ' + regions);

            var price = 0;
            Array.prototype.slice.call(rs_template.getElementsByClassName('nodes')[0].children).forEach(function (child) {
                if (child.offsetHeight == 0)return;

                var translated_size;
                var child_ram = child.getElementsByClassName('node_ram')[0].innerText;
                if (child_ram.includes('64GB')) {
                    translated_size = 'm4.4xlarge';
                } else if (child_ram.includes('32GB')) {
                    translated_size = 'm4.2xlarge';
                } else if (child_ram.includes('16GB')) {
                    translated_size = 'm4.xlarge';
                } else if (child_ram.includes('8GB')) {
                    translated_size = 'm4.large';
                } else if (child_ram.includes('4GB')) {
                    translated_size = 't2.medium';
                } else if (child_ram.includes('2GB')) {
                    translated_size = 't2.small';
                } else if (child_ram.includes('1GB')) {
                    translated_size = 't2.micro';
                } else if (child_ram.includes('0.5GB')) {
                    translated_size = 't2.nano';
                }


                //modify region_counts
                var child_region = child.getElementsByClassName('node_region')[0].innerText;

                //calculate price
                if (translated_size) {
                    price += 720 * calculateServerPricePerHour(translated_size, child_region, 0);
                }

                if (!region_counts[child_region]) {
                    region_counts[child_region] = 1;
                } else {
                    region_counts[child_region]++;
                }
            });

            //summary slide
            Object.keys(region_counts).forEach(function (region) {
                summary_template.getElementsByClassName('summary_regions')[0].innerText += region_counts[region] + 'x ' + region + '\n'
            });

            console.log('price: ' + price);
            summary_template.getElementsByClassName('price')[0].innerText = '$' + Math.round(price);

            //final markers
        } else if (db_type.includes('Shared')) {
            if (region) {
                summary_template.getElementsByClassName('summary_regions')[0].innerText += '1x ' + region
            }

            summary_template.getElementsByClassName('price')[0].innerText = 'FREE';
        } else { //standalone

            if (region) {
                summary_template.getElementsByClassName('summary_regions')[0].innerText += '1x ' + region
            }

            var price = 720 * calculateServerPricePerHour(translated_size, region, 0);
            console.log('Price: ' + price);
            summary_template.getElementsByClassName('price')[0].innerText = '$' + Math.round(price);
        }


        map.setZoom(1);
        return;
    }

    jquery_fields.slick('slickNext');
}

function retreat() { //lol
    console.log('Current: ' + jquery_fields.slick('slickCurrentSlide'));

    jquery_fields.slick('slickPrev');

    if (jquery_fields.slick('slickCurrentSlide') == 0) {

        //if name is invalid grey out the advance button until the field is finished!
        document.getElementById('next_button').style.display = 'none';
        document.getElementById('back_button').style.display = 'none';

        //remove all additional slides
        jquery_fields.slick('slickRemove', 3);
        jquery_fields.slick('slickRemove', 2);
        jquery_fields.slick('slickRemove', 1);

        console.log('REMOVED!');

        name_slide_added = false;
        checkout_rs = false;

        //clear search text, invalidate
        var search_text = name_template.getElementsByClassName('search-text')[0];
        var search_form = name_template.getElementsByClassName('search-form')[0];
        search_form.style.border = '2px solid #999;';

        search_text.value = '';
        name_template.getElementsByClassName('db_name')[0].innerText = '[name]';
        db_name_valid = false;

    } else if (jquery_fields.slick('slickCurrentSlide') == 1) {
        document.getElementById('next_button').style.display = '';
        document.getElementById('next_button').style.opacity = '1';

    } else if (jquery_fields.slick('slickCurrentSlide') == 2) {
        document.getElementById('create_button').style.display = 'none';
        document.getElementById('next_button').style.display = '';

    }
}

function computeAWSRegions() {
    // Array.prototype.slice.call(document.getElementById('region_dropdown').children).forEach(function (child) {
    //     if (db_type == 0 && !shared_regions.includes(child.innerText)) {
    //         child.style.display = 'none';
    //     } else {
    //         child.style.display = '';
    //     }
    // });
}

function submit() {
    console.log('SUBMITTING!');

    showFields(false);
    showProgress(true);

    //check customer
    getCustomerCards(function (err, cards) {
        if (err)return;

        //if no payment info and were not creating a free database
        if (cards.length == 0 && !db_type.includes('Shared')) {
            var success_token;
            var handler = StripeCheckout.configure({
                key: 'pk_test_Skh6t0O9MKk80wiE7BZECxbu',
                email: cached_customer.email,
                locale: 'auto',
                zipCode: true,
                name: 'Add Payment Method',
                token: function (token) {
                    //SUCCESSFULLY GOT CARD TOKEN!!!
                    //post to cards
                    success_token = token;
                    add_stripe_token(token.id, function (err) {
                        if (err) console.error(err);
                        mixpanel.track('Added Card');
                        beginProvisioning();
                    });
                },
                closed: function () {
                    //check if failed
                    if (!success_token) {
                        showFields(true);
                        showProgress(false);
                    }
                }
            });

            handler.open({
                name: 'DBGrow',
                description: 'Add a new payment method',
                amount: 0
            });
            return;
        }

        //otherwise just start
        beginProvisioning();
    });
}

var ws;
function beginProvisioning() {
    var url = 'ws://' + window.location.hostname + ':' + window.location.port + '/api/create_db';
    if (!window.location.href.includes('localhost')) {
        url = 'wss://' + window.location.hostname + '/api/create_db';
    }

    url += '?db_id=' + encodeURIComponent(db_name);

    if (db_type == 'Shared') {
        url += '&db_type=' + encodeURIComponent('SHARED_STANDALONE');
        url += '&region=' + encodeURIComponent(region);
    }
    else if (db_type == 'Standalone') {
        url += '&db_type=' + encodeURIComponent('STANDALONE');
        url += '&region=' + encodeURIComponent(region);
    }
    else if (db_type.includes('Replica')) {
        url += '&db_type=' + encodeURIComponent('REPLICA_SET');
        url += '&region_counts=' + encodeURIComponent(JSON.stringify(region_counts));
    }

    //instance type translation
    if (ram.includes('64GB')) {
        url += '&size=' + encodeURIComponent('m4.4xlarge');
    } else if (ram.includes('32GB')) {
        url += '&size=' + encodeURIComponent('m4.2xlarge');
    } else if (ram.includes('16GB')) {
        url += '&size=' + encodeURIComponent('m4.xlarge');
    } else if (ram.includes('8GB')) {
        url += '&size=' + encodeURIComponent('m4.large');
    } else if (ram.includes('4GB')) {
        url += '&size=' + encodeURIComponent('t2.medium');
    } else if (ram.includes('2GB')) {
        url += '&size=' + encodeURIComponent('t2.small');
    } else if (ram.includes('1GB')) {
        url += '&size=' + encodeURIComponent('t2.micro');
    } else if (ram.includes('0.5GB')) {
        url += '&size=' + encodeURIComponent('t2.nano');
    }

    console.log(region_counts);

    console.log(url);

    ws = new WebSocket(url);
    ws.onopen = function () {
        console.log("WS Opened!");
        mixpanel.track('Created Database');
    };

    ws.onmessage = function (json) {
        var packet = JSON.parse(json.data);
        if (packet.error) {
            alert(JSON.stringify(packet, undefined, 2));
            return;
        }
        console.log(JSON.stringify(packet, undefined, 2));
        if (packet.event == 'COMPLETE') { //WE'RE DONE PROVISIONING! Go to the console!
            window.location.href = window.location.origin + '/console/' + encodeURIComponent(db_name);
            return;
        }

        if (packet.event == 'UPDATE') {
            //show update text for longer running ops
            document.getElementById('status_text').style.display = 'inline';
            document.getElementById('status_text').innerHTML = packet.message;
        }
    };
    ws.onerror = function (error) {
        console.error(error);
        alert(JSON.stringify(error, undefined, 2));
    };

    ws.onclose = function () {
        // alert('WS closed! Provisioning aborted');
    }
}

function checkDBName(name, callback) {
    $.ajax({
        type: "GET",
        url: '/api/db/' + name + '/exists',
        success: function (data) {
            console.log(data);
            //check status code
            // var a = JSON.parse(data);
            callback(data.exists);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //notify error!
            // console.log(jqXHR);
            callback(true);
        }
    });
}

function getCustomerCards(callback) {
    $.ajax({
        type: "GET",
        url: '/internal/customer/cards',
        success: function (data) {
            console.log(data);
            //check status code
            // var a = JSON.parse(data);
            callback(undefined, data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //notify error!
            // console.log(jqXHR);
            console.error('ERR');
            alert('ERR');
            callback(undefined);
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
            alert('ERR');
            callback(jqXHR);
        }
    });
}


function showFields(show) {
    if (!show) {
        fields.style.display = 'none';
        document.getElementById('create_button').style.display = 'none';
    } else {
        fields.style.display = '';
        document.getElementById('create_button').style.display = '';
    }
}

function showProgress(show) {
    if (!show) progress.style.display = 'none';
    else progress.style.display = 'inline';
}

var map;

function initMap() {
    //init regions

    //LOL lots of these are wrong!!!
    regions = {
        us_east_1: new google.maps.LatLng(37.546964, -77.450349),
        us_east_2: new google.maps.LatLng(40.367474, -82.996216),
        us_west_1: new google.maps.LatLng(36.7783, -119.4179),
        us_west_2: new google.maps.LatLng(43.8041, -120.5542),
        ca_central_1: new google.maps.LatLng(49.990604, -93.778894),
        eu_west_1: new google.maps.LatLng(53.2734, -7.778320310000026),
        eu_west_2: new google.maps.LatLng(51.5074, 0.1278),
        eu_west_3: new google.maps.LatLng(48.766708, 2.325085),
        eu_central_1: new google.maps.LatLng(50.1109, 8.6821),
        ap_northeast_1: new google.maps.LatLng(35.6895, 139.6917),
        ap_northeast_2: new google.maps.LatLng(37.5665, 126.9780),
        ap_southeast_1: new google.maps.LatLng(1.3521, 103.8198),
        ap_southeast_2: new google.maps.LatLng(-33.888977, 151.224443),
        ap_south_1: new google.maps.LatLng(19.0760, 72.8777),
        sa_east_1: new google.maps.LatLng(-23.5505, -46.6333)
    };

    var latlng = new google.maps.LatLng(40.0, 0);
    map = new google.maps.Map(document.getElementById('map'), {
        center: latlng,
        zoom: 2,
        mapTypeControl: false,
        disableDefaultUI: true,
        zoomControl: false,
        // gestureHandling: 'none',
        scaleControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        backgroundColor: '#000511',
        styles: [
            {
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#1d2c4d"
                    }
                ]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#8ec3b9"
                    }
                ]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "color": "#1a3646"
                    }
                ]
            },
            {
                "featureType": "administrative",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "administrative.country",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "administrative.country",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "color": "#4b6878"
                    }
                ]
            },
            {
                "featureType": "administrative.land_parcel",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#64779e"
                    }
                ]
            },
            {
                "featureType": "administrative.province",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "administrative.province",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "color": "#4b6878"
                    }
                ]
            },
            {
                "featureType": "landscape.man_made",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "color": "#334e87"
                    }
                ]
            },
            {
                "featureType": "landscape.natural",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#023e58"
                    }
                ]
            },
            {
                "featureType": "poi",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#283d6a"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#6f9ba5"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "color": "#1d2c4d"
                    }
                ]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#023e58"
                    }
                ]
            },
            {
                "featureType": "poi.park",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#3C7680"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#304a7d"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#98a5be"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "color": "#1d2c4d"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#2c6675"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "color": "#255763"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#b0d5ce"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "color": "#023e58"
                    }
                ]
            },
            {
                "featureType": "transit",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "transit",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#98a5be"
                    }
                ]
            },
            {
                "featureType": "transit",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "color": "#1d2c4d"
                    }
                ]
            },
            {
                "featureType": "transit.line",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#283d6a"
                    }
                ]
            },
            {
                "featureType": "transit.station",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#3a4762"
                    }
                ]
            },
            {
                "featureType": "water",
                "stylers": [
                    {
                        "color": "#000511"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#0e1626"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#000511"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "labels",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#4e6d70"
                    }
                ]
            }
        ]
    });

    for (var region in regions) {
        if (regions.hasOwnProperty(region)) {
            marker = new google.maps.Marker({
                position: new google.maps.LatLng(regions[region].lat() - 1.2, regions[region].lng()),
                map: map,
                icon: '../common/img/marker_unselect.png',
                size: new google.maps.Size(20, 32),
                // The origin for this image is (0, 0).
                origin: new google.maps.Point(0, 0),
                // The anchor for this image is the base of the flagpole at (0, 32).
                anchor: new google.maps.Point(0, 32)
                // anchor: new google.maps.Point(-60, -60),
            });
            marker.setOpacity(0.25)
        }
    }

    //init on us-west-2
    moveToLatLngWithOffset(regions['us_west_2']);

}

var marker;

function moveToLatLngWithOffset(latlng) {

    if (marker) marker.setMap(null);
    marker = new google.maps.Marker({
        position: new google.maps.LatLng(latlng.lat() - 1.2, latlng.lng()),
        map: map,
        icon: '../common/img/marker.png',
    });

    map.setZoom(3);
    var camLL = new google.maps.LatLng(latlng.lat() + 12, latlng.lng());
    map.panTo(camLL);
}

function calculateAWSRegionPing(callback) {

}

function add_stripe_token(token, callback) {
    console.log(token);
    $.ajax({
        url: '/internal/customer/cards?' + 'stripe_token=' + encodeURIComponent(token),
        type: 'POST',
        success: function (cards, textStatus, jqXHR) {
            //data - response from server
            callback();
            // refreshCards();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('Add card fail!');
            console.log(jqXHR);
            callback(jqXHR);
        }
    });
}

function registerRegionMenu(menu_element, text_element, callback) {
    var menu = document.getElementsByClassName('regions')[0].cloneNode(true);
    menu.style.display = '';
    var region_drop = new Drop({
        target: menu_element,
        content: menu,
        position: 'bottom center',
        // openOn: 'click'
        openOn: 'click',
        tetherOptions: {
            offset: '20px 12px;'
        }
    });

    Array.prototype.slice.call(menu.children).forEach(function (child) {
        child.onmouseover = function () {
            //move google map
            moveToLatLngWithOffset(regions[child.innerText.replace(/-/g, '_')]);
        };

        child.onclick = function () {
            //move google map to region location
            moveToLatLngWithOffset(regions[child.innerText.replace(/-/g, '_')]);
            text_element.innerHTML = child.innerHTML;

            //set current region for creation
            region_drop.close();
            callback(child.innerHTML)
        };
    });
}

function registerRAMMenu(menu_element, text_element, lower_limit, callback) {
    console.log('RAM0');
    var menu = document.getElementsByClassName('ram_dropdown')[0].cloneNode(true);
    menu.style.display = '';
    var ram_drop = new Drop({
        target: menu_element,
        content: menu,
        position: 'bottom center',
        // openOn: 'click'
        openOn: 'click',
        tetherOptions: {
            offset: '20px 12px;'
        }
    });
    console.log('RAM');
    Array.prototype.slice.call(menu.children).forEach(function (child) {
        var gb = child.innerText.replace('GB', '');
        if (gb <= lower_limit) {
            child.style.display = 'none';
            return;
        }

        child.onclick = function () {
            //move google map to region location
            text_element.innerHTML = child.innerHTML;
            ram_drop.close();
            callback(child.innerText);
        };
    });


}

function registerMembersMenu(menu_element, text_element, add, callback) {
    var menu = document.getElementsByClassName(add ? 'add_member_dropdown' : 'member_dropdown')[0].cloneNode(true);
    menu.style.display = '';
    var ram_drop = new Drop({
        target: menu_element,
        content: menu,
        position: 'bottom center',
        // openOn: 'click'
        openOn: 'click',
        tetherOptions: {
            offset: '20px 12px;'
        }
    });
    Array.prototype.slice.call(menu.children).forEach(function (child) {
        child.onclick = function () {
            //move google map to region location
            text_element.innerHTML = child.innerHTML;
            ram_drop.close();
            callback(child.innerText);
        };
    });
}

//PRICING WORK!!!
var AWS_INSTANCES_HR = {
    't2.nano': 0.0058,
    't2.micro': 0.0116,
    't2.small': 0.0230,
    't2.medium': 0.0464,
    'm4.large': 0.100,
    'm4.xlarge': 0.200,
    'm4.2xlarge': 0.400,
    'm4.4xlarge': 0.800,
};

//Coeffs based on Virginia/Oregon
//taken from blog so be careful!
var region_coeffs = {
    //NORTH AMERICA
    'us-west-1': 1.190, //California
    'us-west-2': 1.0, //Oregon

    'us-east-1': 1.0, //Virginia
    'us-east-2': 1.0, //Ohio

    'ca-central-1': 1.103, //Canada (Calgary)

    //SOUTH AMERICA
    'sa-east-1': 1.603, //Sao Paulo

    //EUROPE
    'eu-west-1': 1.086, //Ireland
    'eu-west-2': 1.138, //London
    'eu-west-3': 1.138, //London
    'eu-central-1': 1.155, //Frankfurt

    //EAST ASIA/OCEANIA
    'ap-northeast-1': 1.310, //Tokyo
    'ap-northeast-2': 1.241, //Seoul
    'ap-southeast-1': 1.259, //Singapore

    'ap-southeast-2': 1.259, //Australia

    //INDIA
    'ap-south-1': 1.241 //Mumbai
};

var storageRegionCoefs = {
//NORTH AMERICA
    'us-west-1': 1.2, //California
    'us-west-2': 1.0, //Oregon

    'us-east-1': 1.0, //Virginia
    'us-east-2': 1.0, //Ohio

    'ca-central-1': 1.1, //Canada (Calgary)

    //SOUTH AMERICA
    'sa-east-1': 1.9, //Sao Paulo

    //EUROPE
    'eu-west-1': 1.1, //Ireland
    'eu-west-2': 1.16, //London
    'eu-west-3': 1.16, //London
    'eu-central-1': 1.19, //Frankfurt

    //EAST ASIA/OCEANIA
    'ap-northeast-1': 1.2, //Tokyo
    'ap-northeast-2': 1.14, //Seoul
    'ap-southeast-1': 1.2, //Singapore

    'ap-southeast-2': 1.2, //Australia

    //INDIA
    'ap-south-1': 1.14 //Mumbai
};

var dataTransferRegionCoefs = {
//NORTH AMERICA
    'us-west-1': 1.0, //California
    'us-west-2': 1.0, //Oregon

    'us-east-1': 1.0, //Virginia
    'us-east-2': 1.0, //Ohio

    'ca-central-1': 1.0, //Canada (Calgary)

    //SOUTH AMERICA
    'sa-east-1': 2.5, //Sao Paulo

    //EUROPE
    'eu-west-1': 1.0, //Ireland
    'eu-west-2': 1.0, //London
    'eu-west-3': 1.0, //London
    'eu-central-1': 1.0, //Frankfurt

    //EAST ASIA/OCEANIA
    'ap-northeast-1': 1.4, //Tokyo
    'ap-northeast-2': 1.26, //Seoul
    'ap-southeast-1': 1.2, //Singapore

    'ap-southeast-2': 1.4, //Australia

    //INDIA
    'ap-south-1': 1.093 //Mumbai
};
var serverPriceTiers = {
    't2.nano': 2,
    't2.micro': 1.95,
    't2.small': 1.9,
    't2.medium': 1.8,
    'm4.large': 1.7,
    'm4.xlarge': 1.6,
    'm4.2xlarge': 1.5,
    'm4.4xlarge': 1.4,
};

var storageType = {
    'sc1': .25,
    'st1': .45,
    'gp2': 1,
    'io1': 1.25,
};

var serverPriceArray = [2, 1.95, 1.9, 1.8, 1.7, 1.6, 1.5, 1.4];
var AWSCostArray = [
    0.0058,
    0.0116,
    0.0230,
    0.0464,
    0.100,
    0.200,
    0.400,
    0.800
];

var serverPrices = {
    't2.nano': 12,
    't2.micro': 20,
    't2.small': 35,
    't2.medium': 70,
    'm4.large': 140,
    'm4.xlarge': 260,
    'm4.2xlarge': 485,
    'm4.4xlarge': 900,
};

// console.log(calculateServerPricePerHour('t2.small', 'ap-south-1', 100));

/*function calculateServerPricePerHour(serverType, region, storage) {
 var index = convertToIndex(serverType);
 var cumCost = 0;
 cumCost += serverPriceArray[0] * AWSCostArray[0];
 for (var i = 1; i <= index; i++) {
 cumCost += (AWSCostArray[i] - AWSCostArray[i - 1]) * serverPriceArray[i];
 }
 cumCost += storage * .00019306 * 1.25;

 return cumCost * region_coeffs[region];
 }*/

function calculateServerPricePerHour(size, region, storage) {
    var index = convertToIndex(size);
    /*
     cumCost += serverPriceArray[0] * AWSCostArray[0];
     for (var i = 1; i <= index; i++) {
     cumCost += (AWSCostArray[i] - AWSCostArray[i - 1]) * serverPriceArray[i];
     }
     cumCost += storage * .00019306 * 1.25;

     return cumCost * region_coeffs[region];
     */
    return (serverPrices[size] * region_coeffs[region]) / 720;
}


function convertToIndex(serverType) {
    return Object.keys(AWS_INSTANCES_HR).indexOf(serverType);
}


function addNode(region, ram) {
    var template = document.getElementsByClassName('node_template')[0].cloneNode(true);
    template.getElementsByClassName('node_region')[0].innerText = region;
    template.getElementsByClassName('node_ram')[0].innerText = ram;
    if (ram.includes('Shared')) template.getElementsByClassName('node_ram')[0].innerText = 'Shared RAM';
    template.getElementsByClassName('node_remove')[0].onclick = function () {
        mixpanel.track('Removed Create DB Pricing Node');
        template.style.display = 'none';
        recalculatePricing();
        calculateWarning();
    };
    template.style.display = '';
    rs_template.getElementsByClassName('nodes')[0].appendChild(template);
    recalculatePricing();
    calculateWarning();
}

function recalculatePricing() {

    /*if (price > 0) {
     // document.getElementById('price').innerText = '$' + price + '/mo';
     } else {
     // document.getElementById('price').innerText = 'FREE/mo'
     }*/
}


var calculateWarning = function () {
    var vis_count = 0;
    var shared_count = 0;
    Array.prototype.slice.call(rs_template.getElementsByClassName('nodes')[0].children).forEach(function (child) {
        if (child.offsetHeight == 0)return;
        vis_count++;
        if (child.getElementsByClassName('node_ram')[0].innerText.includes('Shared')) {
            shared_count++;
        }
    });

    if (vis_count >= 0 && vis_count < 3) {
        rs_template.getElementsByClassName('rs_warning')[0].style.display = '';
        document.getElementById('next_button').style.opacity = '0.5';
    } else if (vis_count > 3 && vis_count % 2 == 0) {
        rs_template.getElementsByClassName('rs_warning')[0].style.display = 'none';
        rs_template.getElementsByClassName('rs_odd_warning')[0].style.display = '';
        document.getElementById('next_button').style.opacity = '0.5';
    } else {
        rs_template.getElementsByClassName('rs_warning')[0].style.display = 'none';
        rs_template.getElementsByClassName('rs_odd_warning')[0].style.display = 'none';
        document.getElementById('next_button').style.opacity = '1';
    }
};