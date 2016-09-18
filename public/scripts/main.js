'use strict';

function Dunia() {
	this.checkSetup();

	// Shortcuts to DOM Elements.
  this.visitedList = document.getElementById('visited');
  this.messageForm = document.getElementById('message-form');
  this.messageInput = document.getElementById('message');
  this.submitButton = document.getElementById('submit');
  this.submitImageButton = document.getElementById('submitImage');
  this.imageForm = document.getElementById('image-form');
  this.mediaCapture = document.getElementById('mediaCapture');
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

// Template for messages.
Dunia.VISITED_TEMPLATE =
    '<div class="message-container">' +
      '<div class="spacing"><div class="pic"></div></div>' +
      '<div class="message"><div class="lat"></div><div class="lng"></div></div>' +
      '<div class="name"></div>' +
    '</div>';

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

// Loads visted places and listen for new ones.
Dunia.prototype.loadVisited = function() {
  // Ref to the /visited/ database path
  this.visitedRef = this.database.ref('places');
  // remove all previous listeners
  this.visitedRef.off();

  // Load last 12 messages and listen for new ones
  var setVisited = function(data) {
    var val = data.val();
    this.displayVisited(data.key, val.lat, val.lng);
  }.bind(this);
  this.visitedRef.limitToLast(12).on('child_added', setVisited);
  this.visitedRef.limitToLast(12).on('child_changed', setVisited);
};

// Displays a Visited Place in the List.
Dunia.prototype.displayVisited = function(key, lat, lng) {
  console.log("Displaying key: " + key);
  var div = document.getElementById(key);
  // If an element for that place does not exist yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = Dunia.VISITED_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.visitedList.appendChild(div);
  }
  /*if (picUrl) {
    div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
  }*/
  div.querySelector('.lat').textContent = lat;
  div.querySelector('.lng').textContent = lng;
  /*var messageElement = div.querySelector('.message');
  if (lat) { // If the message is text.
    messageElement.textContent = text;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  } else if (imageUri) { // If the message is an image.
    var image = document.createElement('img');
    image.addEventListener('load', function() {
      this.messageList.scrollTop = this.messageList.scrollHeight;
    }.bind(this));
    this.setImageUrl(imageUri, image);
    messageElement.innerHTML = '';
    messageElement.appendChild(image);
  }*/
  // Show the card fading-in.
  setTimeout(function() {div.classList.add('visible')}, 1);
  this.visitedList.scrollTop = this.visitedList.scrollHeight;
  this.messageInput.focus();
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

    // We load visited places for user
    this.loadVisited();
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
