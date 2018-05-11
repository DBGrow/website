var github_code;
var google_token;

//elements
var fields;
var progress;
var auth2;

document.addEventListener("DOMContentLoaded", function (event) {

    if (window.location.href.includes('signup')) {
        mixpanel.track('Viewed Sign Up Page');
    } else if (window.location.href.includes('signin')) {
        mixpanel.track('Viewed Sign In Page');
    }

    var url = new URL(window.location);
    github_code = url.searchParams.get("code");
    google_token = url.searchParams.get("google_token");
    if (github_code) console.log('GH token: ' + github_code);
    if (google_token) console.log('Google token: ' + google_token);

    fields = document.getElementById('fields');
    progress = document.getElementById('progress');

    //focus email input

    if (github_code) {
        console.log('Got github login attempt');
        showFields(false);
        showProgress(true);
        submit();
        return;
    }

    if (!github_code && !google_token) {
        showFields(true);
    }

    gapi.load('auth2', function () {
        auth2 = gapi.auth2.init({
            client_id: '942449879792-cbvak6jl56prshsd8kvmqodpen1n5unj.apps.googleusercontent.com',
            // Scopes to request in addition to 'profile' and 'email'
            scope: 'profile'
        });

        auth2.attachClickHandler(document.getElementById('googlebutton'), {},
            function (googleUser) {
                google_token = googleUser.getAuthResponse().id_token;
                showFields(false);
                showProgress(true);
                submit();
            }, function (error) {
                console.error(JSON.stringify(error, undefined, 2));
            });
    });


    document.getElementById('search-text').addEventListener("keydown", function (e) {
        if (e.keyCode === 13) {  //checks whether the pressed key is "Enter"
            submit();
        }
    });

    document.getElementById('search-text-pw').addEventListener("keydown", function (e) {
        if (e.keyCode === 13) {  //checks whether the pressed key is "Enter"
            submit();
        }
    });

    document.getElementById('search-text').focus();

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

function submit() {
    console.log('SUBMITTING!');
    // showFields(false);
    // showProgress(true);

    var email = document.getElementById('search-text').value;
    var email_valid = document.getElementById('search-text').checkValidity();

    var password = document.getElementById('search-text-pw').value;

    //must require either a user name and password or token
    if ((!email && !password) && (!github_code && !google_token)) {
        alert('Email and password, Github, or Google login required!');
        // showFields(true);
        // showProgress(false);
        return;
    }

    if (!email_valid && !github_code && !google_token) {
        alert('Invalid email!');
        // showFields(true);
        // showProgress(false);
        return;
    }

    console.log(github_code, google_token, email, password);
    /*var url = '/signup?';
     if (github_code) {
     url + 'github_code=' + encodeURIComponent(github_code);
     } else if (google_token) {
     url + 'google_token=' + encodeURIComponent(google_token);
     }

     if (password) {
     url + 'google_token=' + encodeURIComponent(google_token);
     }*/

    $.ajax({
        type: "POST",
        url: '/signup',
        headers: {
            github: github_code,
            google: google_token,
            email: email,
            password: password
        },
        success: function (customer) {

            //check status code


            if (github_code) {
                mixpanel.track('Signed Up with Github');
            } else if (google_token) {
                mixpanel.track('Signed Up with Google');
            } else if (email && password) {
                mixpanel.track('Signed Up with Email');
            }

            mixpanel.alias(customer.email);
            mixpanel.identify(customer.email);
            mixpanel.people.set({
                "$first_name": customer.name,
                "$email": customer.email,
                "$picture": customer.picture
            });

            mixpanel.track('Signed Up [any source]');

            <!-- Event snippet for Sign Up conversion page -->
            gtag('event', 'conversion', {'send_to': 'AW-824487907/5sDJCMCPqnoQ49-SiQM'});

            //choose a good DB to open the console to
            window.location.href = window.location.origin + '/account';

            if (!customer.db_ids || customer.db_ids.length == 0) {
                window.location.href = window.location.origin + '/createdb';
                return;
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //notify error!
            // console.log(jqXHR);
            if (jqXHR.status == 409) {
                //redirect to console if attempt was google or GH
                //redirect to login if attempt was email
                var json = $.parseJSON(jqXHR.responseText);
                console.log(json);
                var customer = json.customer;

                mixpanel.identify(customer.email);

                if (github_code) {
                    mixpanel.track('Signed In with Github');
                } else if (google_token) {
                    mixpanel.track('Signed In with Google');
                } else if (email && password) {
                    mixpanel.track('Signed In with Email');
                }

                mixpanel.track('Signed In [any source]');


                //open account page!
                window.location.href = window.location.origin + '/account';
                return;
            }


            if (jqXHR.status == 403) {
                var error = JSON.parse(jqXHR.responseText);
                document.getElementById('invalid_creds').style.display = '';
                document.getElementById('invalid_creds').innerHTML = error.message;
            }
            showProgress(false);
            showFields(true);
            console.error(jqXHR.responseText);

            mixpanel.track('Sign In Failed');
        }
    });
}

var upgrade_topology_container;
function resize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
}

/*
 setTimeout(function () {
 execCaptcha(function (token) {

 });
 console.log('CLICK')
 }, 5000);*/


function showFields(show) {
    if (!show) fields.style.display = 'none';
    else fields.style.display = 'inline';
}

function showProgress(show) {
    if (!show) progress.style.display = 'none';
    else progress.style.display = 'inline';
}