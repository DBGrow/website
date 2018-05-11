var ram = 'Shared';
var region = 'us-west-2';

var rs_selected_ram = '0.5GB';
var rs_selected_region = 'us-west-2';

document.addEventListener("DOMContentLoaded", function (event) {
    mixpanel.track('Viewed Pricing Page');

    //standalone menus
    registerRegionMenu(document.getElementsByClassName('region')[0], document.getElementsByClassName('region_text')[0], function (selected_region) {
        //
        mixpanel.track('Selected Standalone Pricing Region');
        region = selected_region;
        console.log(selected_region);
        //change ram children values because price
        document.getElementById('standalone_price').innerHTML = getStandalonePricingString();
    });

    var standalone_ram_menu = registerRAMMenu(document.getElementsByClassName('ram')[0], document.getElementsByClassName('ram_text')[0], 0, function (selected_ram) {
        mixpanel.track('Selected Standalone Pricing RAM');
        ram = selected_ram;
        console.log(selected_ram);
        //change RAM of all children in server list, then recalculate
        document.getElementById('standalone_price').innerHTML = getStandalonePricingString();
    });

    //refresh children prices in list
    /*
     var getRSPricingString = function () {
     var price = 0;
     Array.prototype.slice.call(document.getElementById('nodes').children).forEach(function (child) {
     var ram = child.getElementsByClassName('node_ram')[0].innerText;
     if (ram.includes('Shared')) {
     return;
     }
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


     price += Math.round(720 * calculateServerPricePerHour(translated_size, region, 0));

     });
     console.log('rsprice: ' + price);
     return '<strong style="font-size: 22px;">$' + price + '</strong>/mo'
     };*/

    document.getElementById('add_node').onclick = function () {
        mixpanel.track('Added RS Pricing Node');
        addNode(rs_selected_region, rs_selected_ram);
    };

    //addition storage
    registerRegionMenu(document.getElementsByClassName('region_0')[0], document.getElementsByClassName('region_text_0')[0], function (selected_region) {
        //calculate storage rate
        document.getElementById('volume_price').innerText = '$' + calculateVolumePricing(selected_region, 1, 'gp2').toFixed(3) + '/GB'
    }, true);


    //rs stuff

    //default free node
    addNode('us-west-2', '0.5GB');
    addNode('us-west-2', '0.5GB');
    addNode('us-west-2', '0.5GB');

    document.getElementById('rs_price').innerHTML = getRSPricingString();

    //set up RS dropdown menus
    registerRegionMenu(document.getElementById('rs_section').getElementsByClassName('region')[0], document.getElementById('rs_section').getElementsByClassName('region_text')[0], function (selected_region) {
        mixpanel.track('Selected RS Pricing Region');
        console.log(selected_region);
        rs_selected_region = selected_region;
        document.getElementById('rs_price').innerHTML = getRSPricingString();
    });

    registerRAMMenu(document.getElementById('rs_section').getElementsByClassName('ram')[0], document.getElementById('rs_section').getElementsByClassName('ram_text')[0], 0, function (selected_ram) {
        mixpanel.track('Selected Standalone Pricing RAM');
        rs_selected_ram = selected_ram;

        //change RAM of all node children
        Array.prototype.slice.call(document.getElementById('nodes').children).forEach(function (node) {

            node.getElementsByClassName('node_ram')[0].innerText = rs_selected_ram;
        });

        document.getElementById('rs_price').innerHTML = getRSPricingString();
    });


    //set up login status
    getCustomer(function (err, customer) {
        if (err) {
            console.error(err);
            return;
        }

        // console.log(customer);

        if (customer) {
            //hide login and register
            document.getElementById('signin').style.display = 'none';
            document.getElementById('signup').style.display = 'none';
            document.getElementById('account').style.display = '';


            document.getElementById('mobile_signin').style.display = 'none';
            document.getElementById('mobile_signup').style.display = 'none';
            document.getElementById('mobile_account').style.display = '';
        }
    });


    //test
    Object.keys(region_coeffs).forEach(function (region) {
        document.getElementById(region + '-header').onclick = function () {
            mixpanel.track('Opened Pricing Table');
            var vis = $('#' + region).is(":visible");
            if (vis) document.getElementById(region).style.display = 'none';
            else document.getElementById(region).style.display = '';
        }

        document.getElementById(region + '-header').onmouseover = function () {
            document.getElementById(region + '-header').style.backgroundColor = '#888888'
        };

        document.getElementById(region + '-header').onmouseout = function () {
            document.getElementById(region + '-header').style.backgroundColor = ''
        };

    });

    populateInstancePricing();


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


    document.getElementById('menu').onclick = function () {
        document.getElementById('menu_content').style.display = '';
    };

    document.getElementById('mobile_menu').onclick = function () {
        document.getElementById('menu_content').style.display = 'none';
    }

    document.getElementById('menu_content').onclick = function () {
        document.getElementById('menu_content').style.display = 'none';
    };
});

function addNode(region, ram) {
    var template = document.getElementsByClassName('node_template')[0].cloneNode(true);
    template.getElementsByClassName('node_region')[0].innerText = region;
    template.getElementsByClassName('node_ram')[0].innerText = ram;
    if (ram.includes('Shared')) template.getElementsByClassName('node_ram')[0].innerText = 'Shared RAM';
    template.getElementsByClassName('node_remove')[0].onclick = function () {
        mixpanel.track('Removed RS Pricing Node');
        template.style.display = 'none';
        document.getElementById('rs_price').innerHTML = getRSPricingString();
        calculateWarning();
    };
    template.style.display = '';
    document.getElementById('nodes').appendChild(template);
    document.getElementById('rs_price').innerHTML = getRSPricingString();
    calculateWarning();
}

function getStandalonePricingString() {
    var price = 0;

    var translated_size;
    var child_ram = document.getElementsByClassName('ram_text')[0].innerText;
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

    if (translated_size) {
        price += Math.round(720 * calculateServerPricePerHour(translated_size, region, 0));
    }

    return '<strong style="font-size: 22px">$' + price + '</strong>/mo';
}

function getRSPricingString() {

    var price = 0;
    var ct = 0;
    Array.prototype.slice.call(document.getElementById('nodes').children).forEach(function (node) {
        if (node.offsetHeight == 0)return;

        ct++;
        var translated_size;
        var child_ram = rs_selected_ram;
        var child_region = node.getElementsByClassName('node_region')[0].innerText;

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

        if (translated_size) {
            price += Math.round(720 * calculateServerPricePerHour(translated_size, child_region, 0));
        }
    });
    console.log(ct + ' nodes priced');

    if (price > 0) {
        // document.getElementById('price').innerText = '$' + price + '/mo';
        return '<strong style="font-size: 22px;">$' + price + '</strong>/mo'
    } else {
        // document.getElementById('price').innerText = 'FREE/mo'
        return '<strong style="font-size: 22px;">$' + price + '</strong>/mo'
    }

}

function clearNodes() {
    document.getElementById('nodes').innerHTML = '';
}

function resize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    //dynamically resize img top offset based on img height
    // document.getElementById('headline_container').style.height = (document.getElementById('header').offsetHeight + document.getElementById('headline').offsetHeight + document.getElementById('image').offsetHeight / 2) + 'px';
    // document.getElementById('button_section').style.marginTop = ((document.getElementById('image').offsetHeight / 2)-16) + 'px';
}

function registerRegionMenu(menu_element, text_element, callback, volume_pricing) {
    var name = 'regions_rev';
    if (volume_pricing) name = 'regions_1'
    var menu = document.getElementsByClassName(name)[0].cloneNode(true);

    menu_element.appendChild(menu);

    text_element.onclick = function () {
        console.log('CLICK');
        menu.style.display = '';
    };

    Array.prototype.slice.call(menu.children).forEach(function (child) {

        child.onclick = function () {
            if (volume_pricing) text_element.innerHTML = child.getElementsByClassName('region')[0].innerHTML;
            else text_element.innerHTML = child.innerHTML;


            //set current region for creation
            // region_drop.close();
            menu.style.display = 'none';

            callback(child.getElementsByClassName('region')[0].innerHTML);
        };
    });
    return menu;
}

function registerRAMMenu(menu_element, text_element, lower_limit, callback) {
    console.log('RAM0');
    var menu = document.getElementsByClassName('ram_rev')[0].cloneNode(true);
    menu_element.appendChild(menu);

    text_element.onclick = function () {
        menu.style.display = '';
    };

    /*var ram_drop = new Drop({
     target: menu_element,
     content: menu,
     position: 'bottom center',
     // openOn: 'click'
     openOn: 'click',
     tetherOptions: {
     offset: '20px 12px;'
     }
     });*/
    console.log('RAM');
    Array.prototype.slice.call(menu.children).forEach(function (child) {
        // var gb = child.innerText.replace('GB', '');
        /*if (gb <= lower_limit) {
         child.style.display = 'none';
         return;
         }*/

        child.onclick = function () {
            menu.style.display = 'none';
            //move google map to region location
            text_element.innerHTML = child.getElementsByClassName('ram')[0].innerText + ' RAM';
            // ram_drop.close();
            callback(child.getElementsByClassName('ram')[0].innerText);
        };
    });

    return menu.children;
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
    'eu-west-3': 1.138, //Paris
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
    'eu-west-3': 1.16, //Paris
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
    'eu-west-3': 1.0, //Paris
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

function calculateVolumePricing(region, storage, storageClass) {
    console.log(region, storage, storageClass)
    return storage * .3 * storageType[storageClass] * (3 * storageRegionCoefs[region] + dataTransferRegionCoefs[region]) / 4;
}

function convertToIndex(serverType) {
    return Object.keys(AWS_INSTANCES_HR).indexOf(serverType);
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
        }
    });
}

var calculateWarning = function () {
    var vis_count = 0;
    var shared_count = 0;
    Array.prototype.slice.call(document.getElementById('nodes').children).forEach(function (child) {
        if (child.offsetHeight == 0)return;
        vis_count++;
        if (child.getElementsByClassName('node_ram')[0].innerText.includes('Shared')) {
            shared_count++;
        }
    });

    if (vis_count >= 0 && vis_count < 3) {
        document.getElementById('rs_warning').style.display = '';
    } else if (vis_count > 3 && vis_count % 2 == 0) {
        document.getElementById('rs_warning').style.display = 'none';
        document.getElementById('rs_odd_warning').style.display = '';
    } else {
        document.getElementById('rs_warning').style.display = 'none';
        document.getElementById('rs_odd_warning').style.display = 'none';

    }
};


function populateInstancePricing() {
    Object.keys(region_coeffs).forEach(function (region) {
        // console.log(region);
        var table = document.getElementById(region);
        //iterate over instance sizes
        Object.keys(AWS_INSTANCES_HR).forEach(function (size) {
            var hourly = calculateServerPricePerHour(size, region, 0);
            // console.log(region+': '+hourly+' '+hourly*720+' '+Math.ceil(hourly*720));
            table.innerHTML += '<tr> <td>' + size + '</td> <td>$' + hourly.toFixed(3) + '/hr</td> <td>$' + Math.round(hourly * 720) + '/mo</td> </tr>'
        });
    });
}