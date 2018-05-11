//elements
var fields;
var progress;

var jquery_fields;

var region_drop;
var ram_drop;
var stripe_token;

var regions;
var database;

var ram = '0.5GB';

var add_nodes = false;

var region = 'us-west-2'; //BECAUSE IT's CHEAP. Could probably come up with something better

var db_type = 'Standalone'

var count = 3; //so we can be safe

var rs_template;
var standalone_template;
var standalone_ram_template;
var rs_ram_template;
var add_nodes_template;

var summary_template;


var cached_customer;

var rs_selected_ram = '0.5GB';
var rs_selected_region = 'us-west-2';

document.addEventListener("DOMContentLoaded", function (event) {
    mixpanel.track('Viewed Upgrade Page');

    fields = document.getElementById('fields');
    progress = document.getElementById('progress');

    //set up templates
    standalone_ram_template = document.getElementById('standalone_ram_template').cloneNode(true);
    standalone_ram_template.setAttribute('id', undefined);
    standalone_ram_template.style.display = '';
    console.log(standalone_ram_template.getElementsByClassName('ram')[0].toString());
    console.log(standalone_ram_template.getElementsByClassName('ram_text')[0].toString());
    registerRAMMenu(standalone_ram_template.getElementsByClassName('ram')[0], standalone_ram_template.getElementsByClassName('ram_text')[0], 0, function (selected_ram) {
        ram = selected_ram;
        summary_template.getElementsByClassName('confirm_ram_text')[0].innerText = selected_ram;

        Array.prototype.slice.call(standalone_ram_template.getElementsByClassName('ram_rec')).forEach(function (rec) {
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

    rs_template = document.getElementById('replica_set_template').cloneNode(true);
    rs_template.setAttribute('id', undefined);
    rs_template.style.display = '';
    registerRAMMenu(rs_template.getElementsByClassName('ram')[0], rs_template.getElementsByClassName('ram_text')[0], 0, function (selected_ram) {
        rs_selected_ram = selected_ram;
        console.log('selected: ' + selected_ram);
        summary_template.getElementsByClassName('confirm_ram_text')[0].innerText = rs_selected_ram;
        Array.prototype.slice.call(rs_template.getElementsByClassName('nodes')[0].children).forEach(function (child) {
            child.getElementsByClassName('node_ram')[0].innerText = rs_selected_ram;
        });
    });

    registerRegionMenu(rs_template.getElementsByClassName('region')[0], rs_template.getElementsByClassName('region_text')[0], function (selected_region) {
        rs_selected_region = selected_region;
    });

    rs_template.getElementsByClassName('add_node')[0].onclick = function () {
        addConvertRSNode(rs_selected_region, rs_selected_ram);
    };


    standalone_template = document.getElementById('standalone_template').cloneNode(true);
    standalone_template.setAttribute('id', undefined);
    standalone_template.style.display = '';
    registerRAMMenu(standalone_template.getElementsByClassName('ram')[0], standalone_template.getElementsByClassName('ram_text')[0], 0, function (selected_ram) {
        //alert('picked RAM ' + ram);
        ram = selected_ram;
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

    rs_ram_template = document.getElementById('replica_ram_template').cloneNode(true);
    rs_ram_template.setAttribute('id', undefined);
    rs_ram_template.style.display = '';
    registerRAMMenu(rs_ram_template.getElementsByClassName('ram')[0], rs_ram_template.getElementsByClassName('ram_text')[0], 0, function (selected_ram) {
        ram = selected_ram;
        //alert('picked RAM ' + ram);
        summary_template.getElementsByClassName('confirm_ram_text')[0].innerText = selected_ram;

        Array.prototype.slice.call(rs_template.getElementsByClassName('ram_rec')).forEach(function (rec) {
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

    add_nodes_template = document.getElementById('add_nodes_template').cloneNode(true);
    add_nodes_template.setAttribute('id', undefined);
    add_nodes_template.style.display = '';


    registerRegionMenu(add_nodes_template.getElementsByClassName('region')[0], add_nodes_template.getElementsByClassName('region_text')[0], function (selected_region) {
        rs_selected_region = selected_region;
    });

    add_nodes_template.getElementsByClassName('add_node')[0].onclick = function () {
        addRSNode(rs_selected_region, ram);
        summary_template.getElementsByClassName('confirm_ram_text')[0].innerText = rs_selected_ram;

        Array.prototype.slice.call(add_nodes_template.getElementsByClassName('nodes')[0].children).forEach(function (child) {
            child.getElementsByClassName('node_ram')[0].innerText = rs_selected_ram;
        });
    };

    summary_template = document.getElementById('summary_template').cloneNode(true);
    summary_template.setAttribute('id', undefined);
    summary_template.style.display = '';

    jquery_fields = $('#fields');
    jquery_fields.slick({
        swipe: false,
        arrows: false,
    });

    database = JSON.parse(getMeta('db'));

    //set DB name in title to this DB
    console.log(JSON.stringify(database, undefined, 2));

    document.getElementById('db_name_0').innerText = database._id;

    var name = database._id;
    name[0] = name[0].toUpperCase();
    document.getElementById('db_name_0').innerText = name;
    summary_template.getElementsByClassName('db_name_text')[0].innerText = name;

    if (database.type.includes('SHARED')) {
        document.getElementById('replica_set_button').style.display = '';
        document.getElementById('standalone_button').style.display = '';
    } else if (database.type.includes('REPLICA')) {
        document.getElementById('add_ram_button').style.display = '';
        document.getElementById('add_nodes_button').style.display = '';
    } else if (database.type.includes('STANDALONE')) {
        document.getElementById('replica_set_button').style.display = '';
        document.getElementById('add_ram_button').style.display = '';
    }

    document.getElementById('next_button').onclick = function () {
        //check fields
        //add final slide
        jquery_fields.slick('slickAdd', summary_template, 1);
        advance();
    };

    document.getElementById('standalone_button').onclick = function () {
        jquery_fields.slick('slickAdd', standalone_template);
        summary_template.getElementsByClassName('confirm_ram_text')[0].innerText = '0.5GB';
        db_type = 'Standalone';
        mixpanel.track('Selected Standalone Upgrade Type');
        advance();
    };

    document.getElementById('add_ram_button').onclick = function () {
        mixpanel.track('Selected Add RAM Upgrade Type');

        if (database.type.includes('STANDALONE')) {
            jquery_fields.slick('slickAdd', standalone_ram_template);
            db_type = 'Standalone';
        }

        if (database.type.includes('REPLICA_SET')) {
            jquery_fields.slick('slickAdd', rs_ram_template);
            db_type = 'Replica Set';
        }
        advance();
    };

    document.getElementById('replica_set_button').onclick = function () {
        count = 3;
        jquery_fields.slick('slickAdd', rs_template);
        summary_template.getElementsByClassName('confirm_ram_text')[0].innerText = '0.5GB';
        db_type = 'Replica Set';
        mixpanel.track('Selected Replica Set Upgrade Type');
        advance();
    };

    document.getElementById('add_nodes_button').onclick = function () {
        //also set add node flag
        count = 2;
        add_nodes = true;
        jquery_fields.slick('slickAdd', add_nodes_template);
        summary_template.getElementsByClassName('confirm_ram_text')[0].innerText = '0.5GB';
        mixpanel.track('Selected Add Nodes Upgrade Type');

        db_type = 'Replica Set';
        advance();
    };

    /*document.getElementById('add_region').onclick = function () {
     if ($("#region_1").css("display") == 'none') {
     document.getElementById('region_1').style.display = '';
     } else if ($("#region_2").css("display") == 'none') {
     document.getElementById('region_2').style.display = '';
     document.getElementById('add_region').style.display = 'none';
     // document.getElementById('remove_region').style.display = '';
     }
     };*/

    //set cust name
    getCustomer(function (err, customer) {
        if (err)return;

        if (customer.name) {
            document.getElementById('account_name').innerText = customer.name;
        } else {
            document.getElementById('account_name').innerText = customer.email;
        }


    })
});

function advance() {
    console.log('SLICK' + jquery_fields.slick('slickCurrentSlide'));

    if (jquery_fields.slick('slickCurrentSlide') == 0) {

        //if name is invalid grey out the advance button until the field is finished!

        document.getElementById('next_button').style.display = '';
        document.getElementById('back_button').style.display = '';
    }

    if (jquery_fields.slick('slickCurrentSlide') == 1) {

    }

    jquery_fields.slick('slickNext');

    if (jquery_fields.slick('slickCurrentSlide') == 1) {
        if (!add_nodes && rs_template.getElementsByClassName('nodes')[0].children.length == 0) {
            addConvertRSNode('us-west-2', '0.5GB');
            addConvertRSNode('us-west-2', '0.5GB');
            addConvertRSNode('us-west-2', '0.5GB');
            calculateRSWarning();
            return;
        } else if (add_nodes && add_nodes_template.getElementsByClassName('nodes')[0].children.length == 0) {
            addRSNode('us-west-2', '0.5GB');
            addRSNode('us-west-2', '0.5GB');
            calculateAddNodesWarning();
            return;
        }

        if (db_type.includes('STANDALONE')) {
            document.getElementById('next_button').style.opacity = '1';
        }
        return;
    }

    if (jquery_fields.slick('slickCurrentSlide') == 2) {
        calculateAddNodesWarning();
        calculateRSWarning();
        //if name is invalid grey out the advance button until the field is finished!

        document.getElementById('next_button').style.display = 'none';
        document.getElementById('create_button').style.display = '';

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

        if (db_type.includes('Replica')) {
            region_counts = {};
            //we're adding nodes
            if (database.type.includes('REPLICA')) {
                var price = 0;

                Array.prototype.slice.call(add_nodes_template.getElementsByClassName('nodes')[0].children).forEach(function (child) {
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
                        price += Math.round(720 * calculateServerPricePerHour(translated_size, child_region, 0));
                    }

                    if (!region_counts[child_region]) {
                        region_counts[child_region] = 1;
                    } else {
                        region_counts[child_region]++;
                    }
                });
            } else {
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
                        price += Math.round(720 * calculateServerPricePerHour(translated_size, child_region, 0));
                    }

                    if (!region_counts[child_region]) {
                        region_counts[child_region] = 1;
                    } else {
                        region_counts[child_region]++;
                    }
                });
            }

            //summary slide
            Object.keys(region_counts).forEach(function (region) {
                if (add_nodes) {
                    summary_template.getElementsByClassName('summary_regions')[0].innerText += '+' + region_counts[region] + 'x ' + region + '\n'
                } else {
                    summary_template.getElementsByClassName('summary_regions')[0].innerText += region_counts[region] + 'x ' + region + '\n'
                }
            });
            summary_template.getElementsByClassName('price')[0].innerText = '$' + price;

            //also RAM
        } else if (db_type.includes('Shared')) {
            if (region) {
                summary_template.getElementsByClassName('summary_regions')[0].innerText += '1x ' + region
            }
            summary_template.getElementsByClassName('price')[0].innerText = 'FREE!';
            summary_template.getElementsByClassName('summary_regions')[0].innerText += '1x ' + region
        } else { //standalone
            if (region) {
                summary_template.getElementsByClassName('summary_regions')[0].innerText += '1x ' + region
            }
            summary_template.getElementsByClassName('price')[0].innerText = '$' + Math.ceil(720 * calculateServerPricePerHour(translated_size, region, 10));
        }

        //
        map.setZoom(1);
    }
}

function retreat() { //lol
    jquery_fields.slick('slickPrev');

    if (jquery_fields.slick('slickCurrentSlide') == 0) {
        //if name is invalid grey out the advance button until the field is finished!
        document.getElementById('next_button').style.display = 'none';
        document.getElementById('back_button').style.display = 'none';

        //remove all additional slides
        jquery_fields.slick('slickRemove', 2);
        jquery_fields.slick('slickRemove', 1);
    } else if (jquery_fields.slick('slickCurrentSlide') == 1) {
        //add name slide
        document.getElementById('next_button').style.display = '';
        document.getElementById('create_button').style.display = 'none';
    } else if (jquery_fields.slick('slickCurrentSlide') == 2) {
        document.getElementById('create_button').style.display = 'none';
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
                    success_token = token;
                    //post to cards
                    add_stripe_token(token.id, function (err) {
                        if (err) console.error(err);

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

function beginProvisioning() {
    console.log('CREATING:');

    var url = '/api/db/' + encodeURIComponent(database._id) + '/upgrade?';

    if (stripe_token) url += '&stripe_token=' + encodeURIComponent(stripe_token);

    //instance type translationx
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

    if (db_type.includes('Standalone')) {
        url += '&db_type=' + encodeURIComponent('STANDALONE');
        url += '&region=' + encodeURIComponent(region);
    } else if (db_type.includes('Replica')) {
        url += '&db_type=' + encodeURIComponent('REPLICA_SET');
        url += '&region_counts=' + encodeURIComponent(JSON.stringify(region_counts));
        console.log(region_counts);
        if (add_nodes) url += '&add_nodes=' + encodeURIComponent(true);
    }

    console.log(url);

    // return;

    $.ajax({
        type: "POST",
        url: url,
        success: function (data) {
            console.log(data);
            showProgress(false);
            document.getElementById('success').style.display = '';
            mixpanel.track('Upgraded Database');
            setTimeout(function () {
                location.replace(window.location.origin + '/console/' + encodeURIComponent(database._id));
            }, 1500);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //notify error!
            // console.log(jqXHR);
            showFields(true);
            showProgress(false);

            alert(jqXHR.responseText);
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

            cached_customer = customer;
            callback(undefined, customer);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //notify error!
            console.log(jqXHR);
            console.error('ERR');
            // alert('ERR');
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
                position: regions[region],
                map: map,
                icon: '../common/img/marker_unselect.png'
            });

            /*if (!database.instances.find(function (instance) {
             return instance.region == region;
             })) {
             marker.setOpacity(0.25)
             }*/

            marker.setOpacity(0.25);
        }
    }

    moveToLatLngWithOffset(regions['us_west_2']);
}

var marker;

function moveToLatLngWithOffset(latlng) {

    if (marker) marker.setMap(null);
    marker = new google.maps.Marker({
        position: latlng,
        map: map,
        icon: '../common/img/marker.png'
    });

    map.setZoom(3);
    var camLL = new google.maps.LatLng(latlng.lat() + 12, latlng.lng());
    map.panTo(camLL);
}

function calculateAWSRegionPing(callback) {

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

function addConvertRSNode(region, ram) {
    var template = document.getElementsByClassName('node_template')[0].cloneNode(true);
    template.getElementsByClassName('node_region')[0].innerText = region;
    template.getElementsByClassName('node_ram')[0].innerText = ram;
    if (ram.includes('Shared')) template.getElementsByClassName('node_ram')[0].innerText = 'Shared RAM';
    template.getElementsByClassName('node_remove')[0].onclick = function () {
        template.style.display = 'none';
        calculateRSWarning();
    };
    template.style.display = '';
    rs_template.getElementsByClassName('nodes')[0].appendChild(template);
    calculateRSWarning();
}

function addRSNode(region, ram) {
    var template = document.getElementsByClassName('node_template')[0].cloneNode(true);
    template.getElementsByClassName('node_region')[0].innerText = region;
    template.getElementsByClassName('node_ram')[0].innerText = ram;
    if (ram.includes('Shared')) template.getElementsByClassName('node_ram')[0].innerText = 'Shared RAM';
    template.getElementsByClassName('node_remove')[0].onclick = function () {
        template.style.display = 'none';
        calculateAddNodesWarning();
    };
    template.style.display = '';
    add_nodes_template.getElementsByClassName('nodes')[0].appendChild(template);
    calculateAddNodesWarning();
}

var calculateRSWarning = function () {
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

var calculateAddNodesWarning = function () {
    var vis_count = 0;
    var shared_count = 0;
    Array.prototype.slice.call(add_nodes_template.getElementsByClassName('nodes')[0].children).forEach(function (child) {
        if (child.offsetHeight == 0)return;
        vis_count++;
        if (child.getElementsByClassName('node_ram')[0].innerText.includes('Shared')) {
            shared_count++;
        }
    });

    if (vis_count >= 0 && vis_count < 2) {
        add_nodes_template.getElementsByClassName('add_nodes_warning')[0].style.display = '';
        document.getElementById('next_button').style.opacity = '0.5';
    } else if (vis_count > 2 && vis_count % 2 != 0) {
        add_nodes_template.getElementsByClassName('add_nodes_warning')[0].style.display = 'none';
        add_nodes_template.getElementsByClassName('add_nodes_even_warning')[0].style.display = '';
        document.getElementById('next_button').style.opacity = '0.5';
    } else {
        add_nodes_template.getElementsByClassName('add_nodes_warning')[0].style.display = 'none';
        add_nodes_template.getElementsByClassName('add_nodes_even_warning')[0].style.display = 'none';
        document.getElementById('next_button').style.opacity = '1';
    }
};