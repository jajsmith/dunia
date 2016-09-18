'use strict';

function Dunia() {
  this.checkSetup();

  // Shortcuts to DOM Elements.
  this.visitedList = document.getElementById('visited');
  this.tovisitList = document.getElementById('tovisit');
  this.messageForm = document.getElementById('message-form');
  this.placeInput = document.getElementById('place');
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
  //this.placeInput.addEventListener('keyup', buttonTogglingHandler);
  //this.placeInput.addEventListener('change', buttonTogglingHandler);

  // Events for image upload.
  //this.submitImageButton.addEventListener('click', function() {
  //  this.mediaCapture.click();
  //}.bind(this));
  //this.mediaCapture.addEventListener('change', this.saveImageMessage.bind(this));

  // Properties for map.
  this.map = null;
  this.markers = {};

  this.initFirebase();
}

//
// CONSTANTS
//

Dunia.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

// Template for messages.
Dunia.VISITED_TEMPLATE =
    '<div class="places-container">' +
      '<div class="spacing"><div class="pic"></div></div>' +
      '<div class="place"><div class="lat"></div><div class="lng"></div></div>' +
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
Dunia.prototype.loadList = function(user, list) {
  // Ref to the /visited/ database path
  this.visitedRef = this.database.ref(list + '/' + user.uid);
  // remove all previous listeners
  this.visitedRef.off();

  // Load last 12 messages and listen for new ones
  
  var setVisited = function(data) {
    var that = this;
    var placeId = data.val();
    console.log('Retrieving places/' + placeId);
    var placeRef = this.database.ref('places/' + placeId).once('value').then(function(snapshot) {
      var place = snapshot.val();
      that.displayList(list, placeId, place.lat, place.lng);
    });
  }.bind(this);
  this.visitedRef.limitToLast(12).on('child_added', setVisited);
  this.visitedRef.limitToLast(12).on('child_changed', setVisited);
};

// Displays a Visited Place in the List.
Dunia.prototype.displayList = function(list, key, lat, lng) {
  console.log("Displaying key: " + key);
  var div = document.getElementById(key);
  var listContainer = this.visitedList;
  if (list == 'tovisit') {
    listContainer = this.tovisitList;
  }
  // If an element for that place does not exist yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = Dunia.VISITED_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    listContainer.appendChild(div);
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
  listContainer.scrollTop = listContainer.scrollHeight;
  //this.placeInput.focus();
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
    this.loadList(user, 'visited');
    // We load places to visit for user
    this.loadList(user, 'tovisit');
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

Dunia.prototype.initMap = function() {
  this.map = new google.maps.Map(document.getElementById('map'), {
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

  // A single window to be open at a time.
  this.infoWindow = new google.maps.InfoWindow();
  this.newMarker = new google.maps.Marker();

  // Add custom markers
  this.map.addListener('click', (function(event) {
    console.log("Click event @" + event.latLng);

    // Place marker at location
    this.newMarker.setPosition(event.latLng);
    this.newMarker.setMap(this.map);

    // Open "New Place" window
    this.infoWindow.setContent("Add a new place!");
    this.infoWindow.open(this.map, this.newMarker);
    // Callback to remove marker if window is closed
    this.infoWindow.addListener('closeclick', (function() {
      this.newMarker.setMap(null);
    }).bind(this));
    //firebase.database().ref('places').push({lat: event.latLng.lat(), lng: event.latLng.lng()});
  }).bind(this));

  // Add/Change/Remove markers with database
  var add_marker_callback = function(snapshot) {
    this.createPlace(snapshot.key, snapshot.val());
  };
  var change_marker_callback = function(snapshot) {
    console.log("Marker changed with id " + snapshot.key);
    this.markers[snapshot.key].setPosition({lat: snapshot.val().lat, lng: snapshot.val().lng});
  };
  var remove_marker_callback = function(snapshot) {
    console.log("Marker removed with id " + snapshot.key);
    this.markers[snapshot.key].setMap(null);
    delete this.markers[snapshot.key];
  };
  firebase.database().ref('places').on('child_added', add_marker_callback.bind(this));
  firebase.database().ref('places').on('child_changed', change_marker_callback.bind(this));
  firebase.database().ref('places').on('child_removed', remove_marker_callback.bind(this));
}

Dunia.prototype.createPlace = function(key, latLng) {
  console.log("Marker added with id " + key);
  this.markers[key] = new google.maps.Marker({
    position: {lat: latLng.lat, lng: latLng.lng},
    map: this.map
  });
  this.markers[key].addListener('click', (function() {
    console.log("Marker selected with id " + key);
    this.infoWindow.setContent("Add " + key + ' to visited');
    this.infoWindow.open(this.map, this.markers[key]);
  }).bind(this));
}

window.onload = function() {
  window.dunia = new Dunia();
  google.load("maps", "3", {other_params: 'key=AIzaSyAHafQFb_sniyg-XC5B_C1oW23sjV1ubIA',
                            callback: Dunia.prototype.initMap.bind(window.dunia)});
};
