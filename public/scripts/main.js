'use strict';

function Dunia() {
	this.checkSetup();

	// Shortcuts to DOM Elements.
  //this.messageList = document.getElementById('messages');
  //this.messageForm = document.getElementById('message-form');
  //this.messageInput = document.getElementById('message');
  //this.submitButton = document.getElementById('submit');
  //this.submitImageButton = document.getElementById('submitImage');
  //this.imageForm = document.getElementById('image-form');
  //this.mediaCapture = document.getElementById('mediaCapture');
  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.signInButton = document.getElementById('sign-in');
  this.signOutButton = document.getElementById('sign-out');
  this.signInSnackbar = document.getElementById('must-signin-snackbar');

  // Saves message on form submit.
  //this.messageForm.addEventListener('submit', this.saveMessage.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  this.signInButton.addEventListener('click', this.signIn.bind(this));

  // Toggle for the button.
  //var buttonTogglingHandler = this.toggleButton.bind(this);
  //this.messageInput.addEventListener('keyup', buttonTogglingHandler);
  //this.messageInput.addEventListener('change', buttonTogglingHandler);

  // Events for image upload.
  //this.submitImageButton.addEventListener('click', function() {
  //  this.mediaCapture.click();
  //}.bind(this));
  //this.mediaCapture.addEventListener('change', this.saveImageMessage.bind(this));

  this.initFirebase();
}

//
// CONSTANTS
//

Dunia.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';


//
// PROTOTYPE FUNCTIONS
//

// Sets up shortcuts to Firebase features and initiate firebase auth.
Dunia.prototype.initFirebase = function() {
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

// Signs-in Dunia
Dunia.prototype.signIn = function(googleUser) {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);};

// Signs-out of Dunia
Dunia.prototype.signOut = function() {
  // Sign out of Firebase.
  this.auth.signOut();
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
Dunia.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    // Get profile pic and user's name from the Firebase user object.
    var profilePicUrl = user.photoURL;   // Get profile pic.
    var userName = user.displayName;        // Get user's name.

    // Set the user's profile pic and name.
    this.userPic.style.backgroundImage = 'url(' + profilePicUrl + ')';
    this.userName.textContent = userName;

    // Show user's profile and sign-out button.
    this.userName.removeAttribute('hidden');
    this.userPic.removeAttribute('hidden');
    this.signOutButton.removeAttribute('hidden');

    // Hide sign-in button.
    this.signInButton.setAttribute('hidden', 'true');

    // We load currently existing chant messages.
    // this.loadMessages();
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    this.userName.setAttribute('hidden', 'true');
    this.userPic.setAttribute('hidden', 'true');
    this.signOutButton.setAttribute('hidden', 'true');

    // Show sign-in button.
    this.signInButton.removeAttribute('hidden');
  }
};


// Let's make sure the Firebase SDK is working properly
Dunia.prototype.checkSetup = function() {
  if (!window.firebase || !(firebase.app instanceof Function) || !window.config) {
    window.alert('Firebase SDK not configured and imported');
  }
};

function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 43.47, lng: -80.5},
    zoom: 12,
    styles: [{
      featureType: 'poi',
      stylers: [{ visibility: 'off' }] // Turn off points of interest.
    }, {
      featureType: 'transit.station',
      stylers: [{ visibility: 'off' }] // Turn off bus stations, train stations, etc.
    }],
    disableDoubleClickZoom: true,
    scrollwheel: false
  });

  var placesRef = firebase.database().ref('places');
  // Add custom markers
  map.addListener('click', function(event) {
    console.log("Click event @" + event.latLng);
    placesRef.push({lat: event.latLng.lat(), lng: event.latLng.lng()});
  });

  // Update markers with database
  placesRef.on('child_added', function(snapshot) {
    var place = snapshot.val();
    if(place == null) return;
    console.log("Marker added @" + place);
    new google.maps.Marker({
      position: {lat: place.lat, lng: place.lng},
      map: map
    });
  });
}

window.onload = function() {
  window.dunia = new Dunia();
  google.load("maps", "3", {other_params: 'key=AIzaSyAHafQFb_sniyg-XC5B_C1oW23sjV1ubIA', callback: initMap})
};
