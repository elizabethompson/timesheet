// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
]

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'

const authorizeButton = document.querySelector('#authorize_button')
const signoutButton = document.querySelector('#signout_button')

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient)
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  const { GAPI_CLIENT_ID, GAPI_API_KEY } = window.config

  if (!GAPI_CLIENT_ID || !GAPI_API_KEY) {
    console.error('Missing configuration')
    return
  }

  gapi.client
    .init({
      apiKey: GAPI_API_KEY,
      clientId: GAPI_CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES,
    })
    .then(
      function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus)

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get())
        authorizeButton.onclick = handleAuthClick
        signoutButton.onclick = handleSignoutClick
      },
      function (error) {
        console.log(error)
      }
    )
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none'
    signoutButton.style.display = 'block'
    Timesheet.init()
  } else {
    authorizeButton.style.display = 'block'
    signoutButton.style.display = 'none'
    Timesheet.reset()
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn()
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut()
}
