import clock from "clock";
import * as document from "document";
import { preferences } from "user-settings";
import * as util from "../common/utils";
import {me as appbit} from "appbit";
import {battery} from "power";
import {HeartRateSensor} from "heart-rate";
import {BodyPresenceSensor} from "body-presence";
import {today, goals} from "user-activity";
import {units} from "user-settings";
import {user} from "user-profile";
import sleep from "sleep";

clock.granularity = "seconds";

const body = new BodyPresenceSensor();
const heart_rate = new HeartRateSensor();
const time = document.getElementById("time");
const date = document.getElementById("date");
const text_elems = document.getElementsByClassName('text');
const days = {0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'};
const months = {0: 'Jan', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'May', 5: 'Jun', 6: 'Jul', 7: 'Aug', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dec'};

const steps = document.getElementById("steps_arc");
const step_text = document.getElementById("step_text");
const distance = document.getElementById("distance_arc");
const distance_text = document.getElementById("distance_text");
const floor = document.getElementById("floor_arc");
const floor_text = document.getElementById("floor_text");
const calories = document.getElementById("cal_arc");
const calories_text = document.getElementById("cal_text");
const active = document.getElementById("active_arc");
const active_text = document.getElementById("active_text");

const resting_arc = document.getElementById("resting_arc");
const fat_burn_arc = document.getElementById("fat_burn_arc");
const cardio_arc = document.getElementById("cardio_arc");
const peak_arc = document.getElementById("peak_arc");
const heart_text = document.getElementById("heart_text");
const heart_img = document.getElementById("heart_img");

body.start();
if (appbit.permissions.granted("access_heart_rate")) {
  if (!body.present) {
      heart_rate.stop();
      no_heart_rate();
    } 
  else {
      heart_rate.start();
    }
}
else {
  no_heart_rate();
}
heart_img.animate("enable");
clock.ontick = (evt) => {
  update_clock(evt);
  update_stats(evt);
  update_date(evt);
}
body.addEventListener("reading", () => {
  if (appbit.permissions.granted("access_heart_rate")) {
    if (!body.present) {
      heart_rate.stop();
      no_heart_rate();
    } else {
      heart_rate.start();
    }
  }
  else {
    no_heart_rate();
  }
});
if (appbit.permissions.granted("sleep")) {
  sleep.addEventListener("change", () => {
     check_sleep();
  });
}
heart_rate.addEventListener("reading", () => {
  update_heart(heart_rate);
});
function update_clock(evt) {
  let today = evt.date;
  let hours = today.getHours();
  if (preferences.clockDisplay === "12h") {
    // 12h format
    hours = hours % 12 || 12;
  } else {
    // 24h format
    hours = util.zeroPad(hours);
  }
  let mins = util.zeroPad(today.getMinutes());
  time.text = `${hours}:${mins}`;
}
function no_heart_rate() {
  heart_text.text = "--";
  resting_arc.style.opacity = 0.25;
  fat_burn_arc.style.opacity = 0.25;
  cardio_arc.style.opacity = 0.25;
  peak_arc.style.opacity = 0.25;
}
function update_heart(heart_rate) {
  var heart_rate = heart_rate.heartRate;
  if (user.heartRateZone(heart_rate) == "out-of-range") { //resting
    resting_arc.style.opacity = 1;
    fat_burn_arc.style.opacity = 0.25;
    cardio_arc.style.opacity = 0.25;
    peak_arc.style.opacity = 0.25;
  }
  else if (user.heartRateZone(heart_rate) == "fat-burn") { //fat burn
    resting_arc.style.opacity = 1;
    fat_burn_arc.style.opacity = 1;
    cardio_arc.style.opacity = 0.25;
    peak_arc.style.opacity = 0.25;
  }
  else if (user.heartRateZone(heart_rate) == "cardio") { //cardio
    resting_arc.style.opacity = 1;
    fat_burn_arc.style.opacity = 1;
    cardio_arc.style.opacity = 1;
    peak_arc.style.opacity = 0.25;
  }
  else if (user.heartRateZone(heart_rate) == "peak") { // peak
    resting_arc.style.opacity = 1;
    fat_burn_arc.style.opacity = 1;
    cardio_arc.style.opacity = 1;
    peak_arc.style.opacity = 1;
  }
  heart_text.text = heart_rate;
}
function check_sleep(evt) {
  if (appbit.permissions.granted("access_sleep")) {
    if (sleep.state == "asleep") {
      text_elems.forEach(text => {
        text.style.fill = 'orange';
      });
    }
    else if (sleep.state == "awake" || sleep.state == "unknown") {
      text_elems.forEach(text => {
        text.style.fill = 'white';
      });
    }
  }
}
function update_date(evt) {
  let today = evt.date;
  date.text = `${days[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()} ${today.getYear()+1900}`;
}
function update_stats(evt) {
  if (appbit.permissions.granted("access_activity")) {
    if (today.adjusted.steps >= goals.steps) {
      steps.sweepAngle = 360;
      step_text.text = today.adjusted.steps;
    }
    else if (today.adjusted.steps == null) {
      steps.sweepAngle = 0;
      step_text.text = "No data";
    }
    else {
      steps.sweepAngle = today.adjusted.steps/goals.steps*360;
      step_text.text = today.adjusted.steps;
    }
    if (today.adjusted.distance == null) {
      distance.sweepAngle = 0;
      distance_text.text = "No data";
    }
    else if  (today.adjusted.distance >= goals.distance) {
      if (units.distance == "us") {
        distance.sweepAngle = 360;
        distance_text.text = Math.round((today.adjusted.distance/1609.344)*100)/100 + " MI";
      }
      else if (units.distance == "metric") {
        distance.sweepAngle = 360;
        distance_text.text = Math.round((today.adjusted.distance/1000)*100)/100 + " KM";
      }
    }
    else {
      if (units.distance == "us") {
        distance.sweepAngle = today.adjusted.distance/goals.distance*360;
        distance_text.text = Math.round((today.adjusted.distance/1609.344)*100)/100 + " MI";
      }
      else if (units.distance == "metric") {
        distance.sweepAngle = today.adjusted.distance/goals.distance*360;
        distance_text.text = Math.round((today.adjusted.distance/1000)*100)/100 + " KM";
      }
    }
    if (today.adjusted.elevationGain == null) {
      floor.sweepAngle = 0;
      floor_text.text = "No data";
    }
    else if  (today.adjusted.elevationGain >= goals.elevationGain) {
      floor.sweepAngle = 360;
      floor_text.text = today.adjusted.elevationGain;
    }
    else {
      floor.sweepAngle = today.adjusted.elevationGain/goals.elevationGain*360;
      floor_text.text = today.adjusted.elevationGain;
    }
    if (today.adjusted.calories == null) {
      calories.sweepAngle = 0;
      calories_text.text = "No data";
    }
    else if  (today.adjusted.calories >= goals.calories) {
      calories.sweepAngle = 360;
      calories_text.text = today.adjusted.calories;
    }
    else {
      calories.sweepAngle = today.adjusted.calories/goals.calories*360;
      calories_text.text = today.adjusted.calories;
    }
    if (today.adjusted.activeZoneMinutes == null) {
      active.sweepAngle = 0;
      active_text.text = "No data";
    }
    else if  (today.adjusted.activeZoneMinutes.total >= goals.activeZoneMinutes.total) {
      active.sweepAngle = 360;
      active_text.text = today.adjusted.activeZoneMinutes.total;
    }
    else {
      active.sweepAngle = today.adjusted.activeZoneMinutes.total/goals.activeZoneMinutes.total*360;
      active_text.text = today.adjusted.activeZoneMinutes.total;
    }
  }
  else {
    steps.sweepAngle = 0;
    step_text.text = "No data";
    distance.sweepAngle = 0;
    distance_text.text = "No data";
    floor.sweepAngle = 0;
    floor_text.text = "No data";
    calories.sweepAngle = 0;
    calories_text.text = "No data";
    active.sweepAngle = 0;
    active_text.text = "No data";
  }
}