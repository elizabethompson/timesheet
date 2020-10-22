const {
  CALENDAR_PATH_EVENTS,
  CALENDAR_PATH_TASKS,
  TICKET_PREFIX,
  TICKET_URL,
} = window.config

const Utils = {
  kabob: function (str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase()
  },

  numInHours: function (num) {
    return `
            <span ref="duration">${num}</span>
            <span>${num <= 1 ? ' hour' : ' hours'}</span>
        `
  },
}

const Timesheet = {
  dateInputRef: '#date_input',

  meetingCalendar: CALENDAR_PATH_EVENTS,
  meetingTableRef: '#meeting_table',

  taskCalendar: CALENDAR_PATH_TASKS,
  taskTableRef: '#task_table',

  ticketPrefix: TICKET_PREFIX,
  ticketURL: TICKET_URL,

  init: function () {
    const dateInput = document.querySelector(this.dateInputRef)

    // add date change listener
    dateInput.addEventListener('change', (event) => {
      this.loadEvents(event.target.value)
    })

    // show container
    const container = document.getElementsByTagName('main')[0]
    container.style.display = 'block'

    // initialize using current date
    dateInput.value = moment().format('Y-M-D')
    dateInput.dispatchEvent(new Event('change'))
  },

  loadEvents: function (date) {
    const config = {
      maxAttendees: 1,
      showDeleted: false,
      singleEvents: true,
      timeMin: moment(date).startOf('day').format(),
      timeMax: moment(date).startOf('day').add(1, 'day').format(),
      orderBy: 'startTime',
    }

    // load meetings
    gapi.client.calendar.events
      .list({
        calendarId: this.meetingCalendar,
        ...config,
      })
      .then((response) => {
        this.renderEvents(
          response.result.items.filter((event) => this.checkIsAccepted(event)),
          this.meetingTableRef
        )

        // load tasks
        gapi.client.calendar.events
          .list({
            calendarId: this.taskCalendar,
            ...config,
          })
          .then((response) => {
            this.renderEventsWithCategories(
              response.result.items,
              this.taskTableRef
            )
          })
      })
  },

  renderEventsWithCategories: function (events, tableEl) {
    // extract event categories
    events.map((event) => {
      const summary = event.summary
      const categoryEnd = summary.indexOf(':')

      event.category = summary.substring(0, categoryEnd)
      event.summary = summary.substring(categoryEnd + 1, summary.length)

      return event
    })

    // render events
    this.renderEvents(events, tableEl)
  },

  renderEvents: function (events, tableEl) {
    // define table ref
    const tableRef = document.querySelector(tableEl)

    // clear table
    tableRef.innerHTML = ''

    // create table elements
    const tableHeader = tableRef.createTHead()
    const tableBody = tableRef.createTBody()
    const tableFooter = tableRef.createTFoot()

    // insert table header
    const headerRow = tableHeader.insertRow()
    headerRow.innerHTML = `
            <thead>
                <tr>
                    <th width="60%">Title</th>
                    <th width="20%">Time Spent</th>
                </tr>
            </thead>
        `

    // initialize total
    let totalDuration = 0

    // loop through events
    for (let event of events) {
      // deconstruct event
      const { id, summary, category, start, end } = event

      // calculate event duration
      const startTime = moment(start.dateTime)
      const endTime = moment(end.dateTime)
      const duration = endTime.diff(startTime, 'hours', true)

      // define event key
      const key = !category ? id : Utils.kabob(category)

      // check if key exists
      const existingRow = tableBody.querySelector(`[ref="${key}"]`)

      // check if previously rendered
      if (existingRow) {
        // define existing row elements
        const delimeter = ' / '
        const summaryRef = existingRow.querySelector('[ref=summary]')
        const timeSpentRef = existingRow.querySelector('[ref=time_spent]')
        const currentTotal = existingRow.querySelector('[ref=duration]')
          .innerHTML
        const isFirstDuplicate = summaryRef.innerHTML.indexOf(delimeter) < 0

        // update element values
        if (isFirstDuplicate) summaryRef.innerHTML += ` (${currentTotal})`
        summaryRef.innerHTML += `${delimeter}${summary} (${duration})`
        timeSpentRef.innerHTML = Utils.numInHours(
          parseFloat(currentTotal) + duration
        )
      } else {
        // insert table row
        const newRow = tableBody.insertRow()

        // set ref value
        const refAttr = document.createAttribute('ref')
        refAttr.value = key
        newRow.setAttributeNode(refAttr)

        // render row content
        newRow.innerHTML = `
                    <td ref="event_title">
                        ${
                          category
                            ? `<tag>
                                ${
                                  !category.includes(this.ticketPrefix)
                                    ? category
                                    : `<a href="${this.ticketURL}/${category}" target="_blank">${category}</a>`
                                }
                            </tag>`
                            : ''
                        }
                        <span ref="summary">${summary}</span>
                    </td>
                    <td ref="time_spent">
                        ${Utils.numInHours(duration)}
                    </td>
                `
      }

      // increment total
      totalDuration += duration
    }

    // insert table footer
    const totalRow = tableFooter.insertRow()
    totalRow.innerHTML = `
            <td></td>
            <td>${Utils.numInHours(totalDuration)}</td>
        `

    // end loading state
    tableRef.classList = 'loaded'
  },

  checkIsAccepted: function (event) {
    if (event && event.attendees) {
      const status = event.attendees[0].responseStatus
      return status.toLowerCase() == 'accepted'
    }
    return true
  },

  reset: function () {
    const container = document.getElementsByTagName('main')[0]
    const tables = document.getElementsByTagName('table')

    // reset tables
    for (let table of tables) {
      table.innerHTML = ''
    }

    // hide container
    container.style.display = 'none'
  },
}
