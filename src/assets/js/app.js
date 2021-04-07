let ScrollMagic = require('ScrollMagic');

const { gsap } = require("gsap/dist/gsap");
const { ScrollToPlugin } = require("gsap/dist/ScrollToPlugin");

gsap.registerPlugin(ScrollToPlugin);



document.addEventListener("DOMContentLoaded",function(e){
  let controller = new ScrollMagic.Controller({
    globalSceneOptions: {
      triggerHook: "onCenter",
      reverse:true
    }

  });

  var scenes = {
  'scene1': {
    'header': 'header-anchor'
  },
  'scene2': {
    'menu': 'menu-anchor'
  },
  'scene3': {
    'story': 'story-anchor'
  },
  'scene4': {
    'social': 'social-anchor'
  }
}

for(var key in scenes) {
  // skip loop if the property is from prototype
  if (!scenes.hasOwnProperty(key)) continue;

  var obj = scenes[key];

  for (var prop in obj) {
    // skip loop if the property is from prototype
    if(!obj.hasOwnProperty(prop)) continue;

    new ScrollMagic.Scene({ triggerElement: '#' + prop })
        .setClassToggle('#' + obj[prop], 'active')
        .addTo(controller);
  }
}


// Change behaviour of controller
// to animate scroll instead of jump
controller.scrollTo(function(target) {
  console.log(target);
  gsap.to(window, 0.5, {
    scrollTo : {
      x : target,
      autoKill : true // Allow scroll position to change outside itself
    }
  });

});



  //  Bind scroll to anchor links using Vanilla JavaScript
  var anchor_nav = document.querySelector('.anchor-nav');

  anchor_nav.addEventListener('click', function(e) {
    var target = e.target,
        id     = target.getAttribute('href');

    if(id !== null && id.length > 0) {
      e.preventDefault();
      controller.scrollTo(id);

      if(window.history && window.history.pushState) {
        history.pushState("", document.title, id);
      }
    }
  });



})
