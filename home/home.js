var scrolled_below_fold = false;
var scrolled_to_bottom = false;

document.addEventListener("DOMContentLoaded", function (event) {
    mixpanel.track('Viewed Home Page');

    var max_scroll = Math.max(document.body.scrollHeight, document.body.offsetHeight,
        document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);

    var fold_y = getPos(document.getElementById('fold')).y;
    window.addEventListener('scroll', function (e) {
        var current_scroll = window.scrollY;
        if (current_scroll > fold_y - 350 && !scrolled_below_fold) { //only trigger once
            scrolled_below_fold = true;
            mixpanel.track('Scrolled Below Home Fold');

        }

        if (current_scroll > max_scroll - 900 && !scrolled_to_bottom) { //only trigger once
            scrolled_to_bottom = true;
            mixpanel.track('Scrolled To Home Bottom');
        }
    });

    setTimeout(function () {
        document.getElementById('userlike-tab').onmousedown = function () {
            window.location.href = window.location.origin + '#chat';
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

    //handle subscription bar
    var search_text = document.getElementById('search-text');
    search_text.onkeyup = function () {

        if (search_text.checkValidity()) {
            document.getElementById('sub_sub').style.color = '#4075ef'
        } else {
            document.getElementById('sub_sub').style.color = '#b6b6b6'
        }
    };

    var sub_submit = document.getElementById('sub_sub');
    sub_submit.onclick = function () {
        if (search_text.checkValidity()) {
            subscribe(search_text.value, function (err) {
                if (err) {
                    console.error(err);
                    return;
                }
                search_text.value = '';
                document.getElementById('sub_sub').style.color = '#b6b6b6'
                alert('Thanks for subscribing! <3 \n Check out our blog at https://medium.com/dbgrow')
            });
        }
    };


    document.getElementById('menu').onclick = function () {
        document.getElementById('menu_content').style.display = '';
    };

    document.getElementById('mobile_menu').onclick = function () {
        document.getElementById('menu_content').style.display = 'none';
    }

    document.getElementById('menu_content').onclick = function(){
        document.getElementById('menu_content').style.display = 'none';
    };
});

function getPos(el) {
    // yay readability
    for (var lx = 0, ly = 0;
         el != null;
         lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent);
    return {x: lx, y: ly};
}

function resize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    //dynamically resize img top offset based on img height
    // document.getElementById('headline_container').style.height = (document.getElementById('header').offsetHeight + document.getElementById('headline').offsetHeight + document.getElementById('image').offsetHeight / 2) + 'px';
    // document.getElementById('button_section').style.marginTop = ((document.getElementById('image').offsetHeight / 2)-16) + 'px';
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

function subscribe(email, callback) {
    $.ajax({
        type: "POST",
        url: '/internal/subscribe?email=' + encodeURIComponent(email),
        success: function (customer) {
            console.log(customer);
            //check status code
            // var a = JSON.parse(data);
            mixpanel.track('Subscribed To Newsletter');
            callback();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //notify error!
            // console.log(jqXHR);
            console.error('ERR');
            callback(jqXHR);
        }
    });
}