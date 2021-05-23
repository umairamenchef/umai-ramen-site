/* eslint-disable */

let ScrollMagic = require('ScrollMagic')

const { gsap } = require("gsap/dist/gsap")
const { ExpoScaleEase, RoughEase, SlowMo } = require("gsap/dist/EasePack")
const { ScrollToPlugin } = require("gsap/dist/ScrollToPlugin")

gsap.registerPlugin(ScrollToPlugin);

document.addEventListener('DOMContentLoaded',function(e){
  const burger = document.querySelector(".burger");
  const closemenu = document.querySelector(".header-mobile__close");
  let headermobile = document.querySelector(".header-mobile");

  burger.addEventListener('click', e => {
    headermobile.classList.add("open");
  });
  closemenu.addEventListener('click', e => {
    headermobile.classList.remove("open");
  });


  if(document.querySelector('.mainpage')) {


    const controller = new ScrollMagic.Controller({
      globalSceneOptions: {
        triggerHook: 'onCenter'
      }

    })

    const scenes = {
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
    },
    "scene5": {
      'header': 'bkg-header'
    },
    "scene6": {
      'menu': 'bkg-menu'
    },
    "scene7": {
      'story': 'bkg-story'
    },
    "scene8": {
      'social': 'bkg-social'
    }
  }

  for(var key in scenes) {
    // skip loop if the property is from prototype
    if (!scenes.hasOwnProperty(key)) continue

    let obj = scenes[key]

    for (var prop in obj) {
      // skip loop if the property is from prototype
      if(!obj.hasOwnProperty(prop)) continue;

      new ScrollMagic.Scene({ triggerElement: '#' + prop })
          .setClassToggle('#' + obj[prop], 'active')
          .reverse(true)
          .addTo(controller)
    }
  }
  controller.scrollTo(function(target) {
    gsap.to(window, 0.5, {
      scrollTo : {
        y : target,
        autoKill : true, // Allow scroll position to change outside itself,
        ease: 'expo.out'
      }
    })

  })

    let anchorsnav = document.querySelectorAll('.anchor-nav')

    anchorsnav.forEach(el => {
      el.addEventListener('click', e => {
        headermobile.classList.remove("open");
        let target = e.target,
            id     = target.getAttribute('href')

        if(id !== null && id.length > 0) {
          e.preventDefault()
          controller.scrollTo(id)

          if(window.history && window.history.pushState) {
            history.pushState("", document.title, id)
          }
        }
      })
    })

  }
})
