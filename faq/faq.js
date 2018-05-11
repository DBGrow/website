var scrolled_below_fold = false;
var scrolled_to_bottom = false;

document.addEventListener("DOMContentLoaded", function (event) {
    mixpanel.track('Viewed FAQ Page');

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