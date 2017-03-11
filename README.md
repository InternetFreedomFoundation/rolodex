Rolodex is IFF's backend database and workflow application.

There are two apps in this repository:
- **server.js**, which runs an Express webserver. 
- **worker.js**, which performs background tasks like sending emails.

They share the libraries and config.

### Installation

```sh
git clone git@github.com:internetfreedomfoundation/rolodex.git
cd rolodex
psql -U rolodex -h localhost < scripts/1.sql
npm install
```

If you are a volunteer with IFF, check #tech on slack for a config.json using shared credentials. Otherwise, copy config.json.example and change the values — you will need to set up an Amazon SES account and a Razorpay account for the relevant features to work correctly.

### Start

```sh
node server.js &
node worker.js &
```

### Database

There are three tables

- **Contacts**, which stores information about supporters. Each row is an email address or phone number.
- **Events**, which is an insert-only log of events, mostly campaign-related things like petition signatures and email opens.
- **Jobs**, which stores scheduled, ongoing an completed jobs for the worker.

Look at scripts/1.sql to learn more.

### Server

Handles three types of requests:
- **Redirects** under /r/, they are used for email click and open tracking.
- **JSON APIs** under /x/, they are called from campaign pages for saving data.
- **Webhooks**  under /s/, they are called from other servers (RazorPay, Amazon).

Each route are defined in a file under routes/ and included in routes.js. Most of them use the pg library to write some values into the database; Some also use sendEmail to send out emails.

### Sending Email

TODO: Document this.

### How to contribute

IFF does not have a full-time tech team; this application exists to support campaigning work, so it is anticipated that many people will make one-time contributions to support one campaign or another. It shouldn't take more than 15 minutes to set up your Rolodex dev environment AND get oriented on what's what.

To make this possible, we prefer libraries that are **popular** over what’s new or most powerful; We avoid adding too many layers of abstraction, even at the cost of some repeated code — each layer of abstraction adds something new to learn. We value obvious over clever.

We're perfectly happy for someone to implement a new feature by copying a similar feature and making a couple of changes.

However, what we do care about is documentation — be sure to explain in sufficient detail what your code does.
