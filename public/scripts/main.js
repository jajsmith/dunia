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

  // User ID
  this.userId = null;

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
      '<div class="place">Title of Place</div>' +
      '<div class="name"><div class="lat"></div><div class="lng"></div></div>' +
    '</div>';

Dunia.TOVISIT_TEMPLATE =
    '<div class="places-container">' +
      '<div class="spacing"><input type="checkbox" class="check"></input></div>' +
      '<div class="place">Title of Place</div>' +
      '<div class="name"><div class="lat"></div><div class="lng"></div></div>' +
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
  console.log("Retrieving " + list + "/" + user.uid);
  this.listRef = this.database.ref(list + '/' + user.uid);
  // remove all previous listeners
  this.listRef.off();

  // Load last 12 messages and listen for new ones
  var that = this;
  var setPlace = function(data) {
    var placeId = data.key;
    console.log('Retrieving places/' + placeId);
    var placeRef = that.database.ref('places/' + placeId).once('value').then(function(snapshot) {
      var place = snapshot.val();
      that.displayList(list, placeId, place.lat, place.lng);
    });
  };
  this.listRef.limitToLast(12).on('child_added', setPlace);
  this.listRef.limitToLast(12).on('child_changed', setPlace);
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
    if (list == 'tovisit') {
      container.innerHTML = Dunia.TOVISIT_TEMPLATE;
    }
    div = container.firstChild;
    div.setAttribute('id', key);

    listContainer.appendChild(div);
  }
  div.querySelector('.lat').textContent = lat;
  div.querySelector('.lng').textContent = lng;

  if (list == 'tovisit') {
    var checkElement = div.querySelector('.check');
    var that = this;
    checkElement.addEventListener('change', function(event) {
      if (event.target.checked) {
        console.log('Writing to visited list');
        // Add a new place in visited list
        that.database.ref('tovisit/' + that.userId + '/' + key).remove().then(function() {
          //remove container
          document.getElementById(key).remove();
          that.database.ref('visited/' + that.userId + '/' + key).set(1);
        }).catch(function(error) {
          console.error('Error removing "to visit" place' + error);
        });
      } else {
        console.log("Checkbox unchecked...");
      }
    });
  }

  // Show the card fading-in.
  setTimeout(function() {div.classList.add('visible')}, 1);
  listContainer.scrollTop = listContainer.scrollHeight;
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
    this.userId = user.uid;
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
    this.newPlace(event.latLng);
  }).bind(this));

  // Add/Change/Remove markers with database
  var add_marker_callback = function(snapshot) {
    this.loadPlace(snapshot.key, snapshot.val());
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

Dunia.prototype.newPlace = function(latLng) {
  console.log("Click event @" + latLng);

  // Remove previous new place
  this.removeNewPlace();

  // Place marker at location
  this.newMarker.setPosition(latLng);
  this.newMarker.setMap(this.map);

  // Open "New Place" window
  this.infoWindow.setContent("Add a new place! <input type='button' id='submit-place' value='Submit'>");
  this.infoWindow.open(this.map, this.newMarker);
  var submit_place = document.getElementById('submit-place');
  submit_place.onclick = this.submitNewPlace.bind(this);

  // Callback to remove marker if window is closed
  this.infoWindow.addListener('closeclick', (function() {
    this.newMarker.setMap(null);
  }).bind(this));
  //firebase.database().ref('places').push({lat: event.latLng.lat(), lng: event.latLng.lng()});
}

Dunia.prototype.submitNewPlace = function() {
  console.log("Submitting new place.");

  firebase.database().ref('places').push({lat: this.newMarker.getPosition().lat(),
                                          lng: this.newMarker.getPosition().lng()});
  this.removeNewPlace();
}

Dunia.prototype.removeNewPlace = function() {
  // Remove marker
  this.newMarker.setMap(null);

  // Close "New Place" window
  this.infoWindow.close();
}

Dunia.prototype.loadPlace = function(key, latLng) {
  console.log("Marker added with id " + key);
  this.markers[key] = new google.maps.Marker({
    position: {lat: latLng.lat, lng: latLng.lng},
    map: this.map
  });
  this.markers[key].addListener('click', (function() {
    console.log("Marker selected with id " + key);

    // Remove previous new place
    this.removeNewPlace();

    // Open "Place" window
    this.infoWindow.setContent("<input type='button' id='add-list-visited' value='Add to Visited'> <input type='button' id='add-list-to-visit' value='Add to To-Visit'>");
    this.infoWindow.open(this.map, this.markers[key]);
    document.getElementById('add-list-visited').onclick = this.addToList.bind(this, key, 'visited');
    document.getElementById('add-list-to-visit').onclick = this.addToList.bind(this, key, 'to-visit');
  }).bind(this));
}

Dunia.prototype.addToList = function(key, list) {
  if(list == 'visited') {
    console.log('Place ' + key + ' added to list Visited');
  } else if(list == 'to-visit') {
    console.log('Place ' + key + ' added to list To-Visit');
  }
  firebase.database().ref(list + '/' + this.userId).push({key: 1});
}

window.onload = function() {
  window.dunia = new Dunia();
  google.load("maps", "3", {other_params: 'key=AIzaSyAHafQFb_sniyg-XC5B_C1oW23sjV1ubIA',
                            callback: Dunia.prototype.initMap.bind(window.dunia)});
};
