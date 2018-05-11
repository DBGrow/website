var customer;

var temp_db_id;

document.addEventListener("DOMContentLoaded", function (event) {
    main();
    mixpanel.track('Viewed Account Page');

    document.getElementById('save_contact_button').onclick = function () {
        var params = {};
        var name = document.getElementById('name_input').value;
        if (name && name != customer.name) {
            params.name = name;
        }

        var company = document.getElementById('company_input').value;
        if (company && company != customer.company) {
            params.company = company;
        }

        var phone = document.getElementById('phone_input').value;
        if (phone && company != customer.phone) {
            params.phone = phone;
        }

        var email = document.getElementById('email_input').value;
        //validate email
        if (email && email != customer.email) {
            if (!document.getElementById('email_input').checkValidity()) {
                alert('Invalid email!');
                return;
            }
            params.email = email;
        }

        var password = document.getElementById('password_input').value;
        //validate email
        if (password) {
            params.password = password;
        }

        var current_password = document.getElementById('current_password_input').value;
        //validate email
        if (current_password) {
            params.current_password = current_password;
        }

        saveCustomer(params, function (err) {
            if (err) {
                alert(JSON.stringify(err, undefined, 2));
                return;
            }
            document.getElementById('contactmodal').style.display = 'none';

            getCustomer(function (err, fresh_customer) {
                if (err) {
                    alert(JSON.stringify(err, undefined, 2));
                    return;
                }

                customer = fresh_customer;

                document.getElementById('email').innerText = fresh_customer.email;
                document.getElementById('email_input').value = fresh_customer.email;

                if (fresh_customer.name) {
                    document.getElementById('name_input').value = fresh_customer.name;
                    document.getElementById('name').style.display = '';
                    document.getElementById('name').innerText = fresh_customer.name;
                }

                if (fresh_customer.phone) {
                    document.getElementById('phone_input').value = fresh_customer.phone;
                    document.getElementById('phone').style.display = '';
                    document.getElementById('phone').innerText = fresh_customer.phone;
                }

                if (fresh_customer.company) {
                    document.getElementById('company_input').value = fresh_customer.company;
                    document.getElementById('company').style.display = '';
                    document.getElementById('company').innerText = fresh_customer.company;
                }

                if (fresh_customer.github_id || fresh_customer.google_id) {
                    document.getElementById('github_google_password_notice').style.display = '';
                    document.getElementById('current_password').style.display = 'none';
                } else {
                    document.getElementById('github_google_password_notice').style.display = 'none';
                    document.getElementById('current_password').style.display = '';
                }
            })
        });
    };
});


var upgrade_topology_container;

function main() {
    try {

        getCustomer(function (err, current_customer) {
            if (err) {
                console.error(err);
                return;
            }


            customer = current_customer;
            //identify with mixpanel!
            mixpanel.people.set({
                "$first_name": customer.name,
                "$email": customer.email,
                "$picture": customer.picture
            });

            //customer fields
            document.getElementById('email').innerText = customer.email;
            document.getElementById('email_input').value = customer.email;

            if (customer.name) {
                document.getElementById('name_input').value = customer.name;
                document.getElementById('name').style.display = '';
                document.getElementById('name').innerText = customer.name;
            }

            if (customer.phone) {
                document.getElementById('phone_input').value = customer.phone;
                document.getElementById('phone').style.display = '';
                document.getElementById('phone').innerText = current_customer.phone;
            }

            if (customer.company) {
                document.getElementById('company_input').value = customer.company;
                document.getElementById('company').style.display = '';
                document.getElementById('company').innerText = current_customer.company;
            }

            if (customer.github_id || customer.google_id) {
                document.getElementById('github_google_password_notice').style.display = '';
                document.getElementById('current_password').style.display = 'none';
            } else {
                document.getElementById('github_google_password_notice').style.display = 'none';
                document.getElementById('current_password').style.display = '';
            }

            document.getElementById('add_database').onclick = function () {
                window.location.href = window.location.origin + '/createdb';
            };

            document.getElementById('add_card').onclick = function () {
                openCardDialog();
            };

            document.getElementById('delete_database_close').onclick = function () {
                //maybe progress instead?
                document.getElementById('deletemodal').style.display = 'none';
            };

            document.getElementById('delete_database_button').onclick = function () {
                if (!temp_db_id)return;

                //maybe progress instead?
                document.getElementById('deletemodal').style.display = 'none';

                deleteDatabase(temp_db_id, function (err) {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    mixpanel.track('Deleted Database');

                    setTimeout(function () {
                        document.getElementById('databases').innerText = '';
                        refreshDatabases();
                    }, 100);

                })
            }

            refreshDatabases();
            refreshCards();
            refreshInvoices()
        });


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
    } catch (err) {
        console.error(err);
    }
}

function addCard(card) {
    var newTemplate = document.getElementById('card_template').cloneNode(true);
    newTemplate.setAttribute('id', undefined);

    var cctype = newTemplate.getElementsByClassName("cctype")[0];

    switch (card.brand) {
        case 'Visa': {
            cctype.classList = 'fa fa-cc-visa';
            break;
        }
        case 'American Express': {
            cctype.classList = 'fa fa-cc-amex';
            break;
        }
        case 'MasterCard': {
            cctype.classList = 'fa fa-cc-mastercard';
            break;
        }
        case 'Discover': {
            cctype.classList = 'fa fa-cc-discover';
            break;
        }
        case 'JCB': {
            cctype.classList = 'fa fa-cc-jcb';
            break;
        }
        case 'Diners Club': {
            cctype.classList = 'fa fa-cc-diners-club';
            break;
        }
        default : {
            console.log('Unknown Card Brand: ' + card.brand);
        }
    }

    newTemplate.getElementsByClassName("ccnumber")[0].innerText = ' ...' + card.last4;
    newTemplate.getElementsByClassName("ccexpiration")[0].textContent = card.exp_month + '/' + (card.exp_year + '').replace('20', '');
    newTemplate.getElementsByClassName("ccdelete")[0].onclick = function () {
        $.ajax({
            url: '/internal/customer/card/' + card.id,
            type: 'DELETE',
            success: function (data, textStatus, jqXHR) {
                console.log("delete card success!");
                mixpanel.track('Deleted Card');
                refreshCards();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("delete card error!");
                console.log(jqXHR);
                showError(JSON.parse(jqXHR.responseText).message)
            }
        });
    };
    newTemplate.style.display = '';
    document.getElementById('cards').appendChild(newTemplate); //add node to bottom
}

function addDatabase(database) {
    var newTemplate = document.getElementById('database_template').cloneNode(true);
    newTemplate.setAttribute('id', undefined);
    newTemplate.getElementsByClassName("database_name")[0].innerText = database._id;

    //go to db console page!
    newTemplate.getElementsByClassName("database_name")[0].onclick = function () {
        window.location.href = window.location.origin + '/console/' + database._id;
    };

    newTemplate.getElementsByClassName("database_delete")[0].onclick = function () {
        //open confirm dialog
        document.getElementById('deletemodal').style.display = 'inline-block';
        temp_db_id = database._id;
    };

    newTemplate.getElementsByClassName("database_upgrade")[0].onclick = function () {
        window.location.href = window.location.origin + '/upgrade/' + database._id;
    };

    newTemplate.style.display = '';
    document.getElementById('databases').appendChild(newTemplate); //add node to bottom

}

function addInvoice(invoice) {
    var newTemplate = document.getElementById('invoice_template').cloneNode(true);
    newTemplate.setAttribute('id', undefined);

    if (new Date(invoice.period_end * 1000) > new Date()) {
        newTemplate.getElementsByClassName("date")[0].innerText = moment.unix(invoice.period_start).format('M/D/YY') + ' - ';
        newTemplate.getElementsByClassName("current")[0].style.display = '';
    } else {
        newTemplate.getElementsByClassName("date")[0].innerText = moment.unix(invoice.period_start).format('M/D/YY') + ' - ' + moment.unix(invoice.period_end).format('M/D/YY');
    }

    /*console.log('amount due: '+invoice.amount_due);
     console.log('eb: '+invoice.ending_balance);
     console.log('paid: '+invoice.paid);
     console.log('total: '+invoice.total);
     console.log('end: '+invoice.period_end);

     */
    newTemplate.getElementsByClassName("amount")[0].innerText = '$' + invoice.total / 100;

    newTemplate.style.display = '';
    document.getElementById('invoices').appendChild(newTemplate); //add node to bottom

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

function add_stripe_token(token) {
    console.log(token);
    $.ajax({
        url: '/internal/customer/cards?' + 'stripe_token=' + encodeURIComponent(token),
        type: 'POST',
        success: function (cards, textStatus, jqXHR) {
            mixpanel.track('Added Card');
            //data - response from server
            refreshCards();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('Add card fail!');
            console.log(jqXHR);
        }
    });
}

function openCardDialog() {
    var handler = StripeCheckout.configure({
        key: 'pk_test_Skh6t0O9MKk80wiE7BZECxbu',
        // image: 'https://s3-us-west-1.amazonaws.com/dbgrow/images/logotext.png',
        email: customer.email,
        locale: 'auto',
        zipCode: true,
        name: 'Add Card',
        token: function (token) {
            //SUCCESSFULLY GOT CARD TOKEN!!!
            console.log(JSON.stringify(token, undefined, 2));
            add_stripe_token(token.id);
        },
        closed: function () {

        }
    });

    handler.open({
        name: 'DBGrow',
        description: 'Add a new payment method',
        amount: 0
    });
}

function refreshCards() {
    document.getElementById('cards').innerHTML = ''; //clear!
    $.ajax({
        url: '/internal/customer/cards',
        type: 'GET',
        success: function (cards, textStatus, jqXHR) {
            //data - response from server
            console.log("got cards JSON:\n" + JSON.stringify(cards));

            if (cards.length == 0) {
                console.log('no cards!');
                // cardsNoCards.style.display = '';
                return;
            }

            cards.forEach(function (card) {
                addCard(card);
            });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('Get cards fail!');
            console.log(jqXHR);
        }
    });
}

function refreshDatabases() {
    document.getElementById('databases').innerHTML = '';
    customer.db_ids.forEach(function (id) {
        getDatabase(id, function (err, database) {
            if (err) {
                console.error(err);
                return;
            }

            addDatabase(database);
        })
    });
}

function getDatabase(db_id, callback) {
    $.ajax({
        url: '/api/db/' + db_id,
        type: 'GET',
        success: function (database, textStatus, jqXHR) {
            callback(undefined, database)
        },
        error: function (jqXHR, textStatus, errorThrown) {
            callback(jqXHR);
        }
    });
}


function deleteDatabase(db_id, callback) {
    $.ajax({
        url: '/api/db/' + db_id,
        type: 'DELETE',
        success: function (database, textStatus, jqXHR) {
            callback(undefined)
        },
        error: function (jqXHR, textStatus, errorThrown) {
            callback(jqXHR);
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
        }
    });
};

function refreshInvoices() {
    document.getElementById('invoices').innerHTML = ''; //clear!
    $.ajax({
        url: '/internal/customer/invoices',
        type: 'GET',
        success: function (invoices, textStatus, jqXHR) {
            //data - response from server
            console.log("got invoices JSON:\n" + JSON.stringify(invoices));

            if (invoices.length == 0) {
                console.log('no cards!');
                // cardsNoCards.style.display = '';
                return;
            }

            invoices.forEach(function (invoice) {
                addInvoice(invoice);
            });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('Get cards fail!');
            console.log(jqXHR);
        }
    });
}

function getInvoices(callback) {
    $.ajax({
        type: "GET",
        url: '/internal/customer/invoices',
        success: function (invoices) {
            console.log(JSON.stringify(invoices, undefined, 2));
            //check status code
            // var a = JSON.parse(data);
            callback(undefined, invoices);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //notify error!
            // console.log(jqXHR);
            console.error('ERR');
            callback(jqXHR);
        }
    });
};

function saveCustomer(params, callback) {
    var url = '/internal/customer?x=0';
    if (params.name) {
        url += '&name=' + encodeURIComponent(params.name);
    }

    if (params.phone) {
        url += '&phone=' + encodeURIComponent(params.phone);
    }
    if (params.company) {
        url += '&company=' + encodeURIComponent(params.company);
    }

    if (params.email) {
        url += '&email=' + encodeURIComponent(params.email);
    }

    if (params.current_password) {
        url += '&current_password=' + encodeURIComponent(params.current_password);
    }

    if (params.password) {
        url += '&password=' + encodeURIComponent(params.password);
    }

    console.log(url);
    $.ajax({
        type: "PATCH",
        url: url,
        success: function () {
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

function showError(text) {
    document.getElementById('errormodal').style.display = 'inline-block';

    try {
        document.getElementById('error_message').innerText = JSON.stringify(text, undefined, 2);
    } catch (e) {
        console.error(e);
        document.getElementById('error_message').innerText = text;
    }
}