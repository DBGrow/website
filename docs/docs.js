document.addEventListener("DOMContentLoaded", function (event) {
    mixpanel.track('Viewed Docs Page');

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
        }
    })
});

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