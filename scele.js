var casper = require('casper').create(),
    sys = require('system'),
    SCELE_URL = 'https://scele.cs.ui.ac.id',
    COURSE_URL = SCELE_URL + '/course/view.php'

if (sys.args.length < 7) {
    console.log('Usage: casperjs scele.js <username> <password> <courseid_1> <courseid_2> .. <courseid_n>')
    exit()
}

var username = sys.args[4],
    password = sys.args[5]

casper.start(SCELE_URL)

// login
casper.then(function() {
    this.echo('SCELE Scrapper \u00A9 Yohanes Gultom, September 2016')

    this.echo(this.getTitle())
    this.fillSelectors('form:first-of-type', {
        'input[name=username]': username,
        'input[name=password]': password},
        true
    )
})

// get user info
casper.waitForSelector('span.usertext', function() {
    this.echo(this.getElementInfo('span.usertext').text + '\n', 'COMMENT')
})

// process courses
for (var i = 6; i < sys.args.length; i++) {
    var courseId = sys.args[i]
    processCourse(courseId)
}


// logout
casper.then(function() {
    this.click('li[role=presentation]:last-child a.menu-action')
})

casper.waitForSelector('#inputName', function() {
    if (this.exists('#span.usertext')) {
        this.echo('Logout failed', 'ERROR')
    } else {
        this.echo('Logout', 'COMMENT')
    }
})

casper.run()

/******* Functions *******/

function processCourse(courseId) {
    casper.thenOpen(COURSE_URL + '?id=' + courseId, function() {
        var that = this

        // print course title
        this.echo(this.getTitle(), 'INFO')

        try {

            // get news
            var newsSelector = 'div.block_news_items .content .unlist'
            if (this.exists(newsSelector)) {
                var newsElements = this.getElementsInfo(newsSelector),
                    news = !newsElements ? [] : newsElements.map(function(elmt) {
                        var html = elmt.html,
                            pattern = /.*<div class="date">([^<]*)<\/div><div class="name">([^<]*)<\/div><\/div><div class="info"><a href="([^"]*)">([^<]*)<\/a><\/div>.*/i,
                            values = html.match(pattern)
                        return {
                            date: values[1],
                            poster: values[2],
                            url: values[3],
                            title: values[4]
                        }
                    })

                this.echo('News', 'INFO')
                news.forEach(function(n) {
                    that.echo('* ' + n.title + ' (' + n.poster + ', ' + n.date + ')')
                })

            } else {
                this.echo('No News', 'COMMENT')
            }

            // get activity
            var activitySelector = 'p.activity'
            if (this.exists(activitySelector)) {
                var activityElements = this.getElementsInfo(activitySelector),
                    news = !activityElements ? [] : activityElements.map(function(elmt) {
                        var html = elmt.html,
                            pattern = /([^<>]*)<br><a href="([^"]*)" [^<>]*>([^<>]*)<\/a>.*/i,
                            values = html.match(pattern)
                        return {
                            name: values[1],
                            url: values[2],
                            fileName: values[3]
                        }
                    })

                this.echo('Activity', 'INFO')
                news.forEach(function(a) {
                    that.echo('* ' + a.name + ' ' + a.fileName + ' (' + a.url + ')')
                })

            } else {
                this.echo('No Activity', 'COMMENT')
            }

        } catch (e) {
            this.echo(e, 'ERROR')
        }

        this.echo('\n')
    })
}
