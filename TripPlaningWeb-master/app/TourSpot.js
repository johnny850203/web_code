class TourSpot {
  // Datas
  name;
  pos;
  mark;
  startTime; // {int value (mins), string text (hh:mm)}
  endTime; // {int value (mins), string text (hh:mm)}
  duration; // {int value (mins), string text (h時mm分)}
  cost;
  id; // id start from 1
  schedulePlate;
  directionsService;

  // Link
  prev;
  next;
  route;
  routeLine;
  trafficTime; // {int value (secs), string text (m 分鐘)}

  constructor(name, pos, id) {
    this.name = name;
    this.pos = pos;
    this.id = id;
    this.next = null;
    this.prev = null;
    this.directionsService = new google.maps.DirectionsService();
  }

  newMark(map) {
    this.mark = new google.maps.Marker({
      map: map,
      label: this.id.toString(),
      icon: "http://maps.google.com/mapfiles/ms/icons/red.png", // 紅色標記
    });
    this.mark.setPosition(this.pos);
  }

  updateMarkId(newId) {
    this.mark.setLabel(newId.toString());
  }

  removeMark() {
    if (this.mark !== undefined) {
      this.mark.setVisible(false);
    }
  }

  calRouteAndTrafficTime() {
    // If the spot is the last spot of the schedule, skip calculation
    if (this.next == null) {
      this.route = null;
      return;
    }

    let start = this;
    let end = this.next;

    return this.directionsService
      .route({
        origin: start.pos,
        destination: end.pos,
        travelMode: google.maps.TravelMode["DRIVING"],
      })
      .then((response) => {
        // 將route從response裡面讀出來
        this.route = response.routes[0].overview_path;
        this.trafficTime = Object.assign(
          {},
          response.routes[0].legs[0].duration
        );

        // Convert trafficTime.value unit from sec to min
        this.trafficTime.value = Math.round(this.trafficTime.value / 60);

        // trafficTime資料格式如下：
        // trafficTime.text = "7 分鐘"
        // trafficTime.value = 7

        console.log(response);
      })
      .catch((e) => {
        window.alert("Directions request failed");
      });
  }

  displayRoute(map) {
    if (this.route == null) {
      console.log("No route");
      return;
    }

    // 根據讀取的route，產生一個新的路徑圖
    let polyline = new google.maps.Polyline({
      path: this.route,
      geodesic: true,
      strokeColor: "#FF0000", // Red
      strokeOpacity: 0.8,
      strokeWeight: 4,
    });

    // 將剛剛產生的路徑圖加到地圖上
    polyline.setMap(map);

    this.routeLine = polyline;
  }

  undisplayRoute() {
    if (this.routeLine != undefined) {
      this.routeLine.setMap(null);
    }
  }

  // ****************************************************************************
  // TIME FUNCTIONS
  // Use setStartTime(), setDuration(), setEndTime() for FIRST TIME initialize
  // the spot. Otherwise use updateStartTime(), updateEndTime()
  // ****************************************************************************

  setStartTime(addPlaceForm) {
    if (this.id === 1) {
      // Get the start time from the form
      let timeText = addPlaceForm.querySelector("#start-time").value; // string
      let timeValue = this.timeTextToValue(timeText);
      this.startTime = {
        value: timeValue,
        text: timeText,
      };
      return;
    }

    this.updateStartTime();
  }

  setDuration(addPlaceForm) {
    if (this.id === 1) {
      this.duration = {
        value: 0,
        text: "0時0分",
      };
      return;
    }

    let durationHr = addPlaceForm.querySelector("#duration-hr").value; // string
    let durationMin = addPlaceForm.querySelector("#duration-min").value; // string

    this.duration = {
      value: parseInt(durationHr) * 60 + parseInt(durationMin),
      text: `${durationHr}時${durationMin}分`,
    };

    console.log(this.duration);
  }

  setEndTime() {
    if (this.id === 1) {
      this.endTime = this.startTime;
      return;
    }

    this.endTime = this.timeAddition(this.startTime, this.duration);
  }

  updateStartTime() {
    if (this.prev == null) return;
    this.startTime = this.timeAddition(
      this.prev.endTime,
      this.prev.trafficTime
    );
  }

  updateEndTime() {
    if (this.startTime == null || this.duration == null) return;
    this.endTime = this.timeAddition(this.startTime, this.duration);
  }

  timeAddition(time1, time2) {
    let resultTimeValue = time1.value + time2.value;
    let resultTimeText = this.timeValueToText(resultTimeValue);

    return {
      value: resultTimeValue,
      text: resultTimeText,
    };
  }

  timeTextToValue(timeText) {
    let [hours, minutes] = timeText.split(":"); // string hours, string minutes
    return parseInt(hours) * 60 + parseInt(minutes);
  }

  timeValueToText(timeValue, format = "hh:mm") {
    let minutes = timeValue % 60;
    let hours = (timeValue - minutes) / 60;

    if (format === "hh:mm") {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    } else {
      return `${hours}時${minutes}分`;
    }
  }

  // ****************************************
  // HTML Indication functions
  // ***************************************

  createSchedulePlate() {
    const dailyScheduleIndication =
      document.querySelector("div.daily-schedule");
    const schedulePlate = document.createElement("div");

    schedulePlate.classList.add("schedule-plate");
    schedulePlate.classList.add(`id-${this.id}`);

    dailyScheduleIndication.appendChild(schedulePlate);
    this.schedulePlate = schedulePlate;
  }

  removeSchedulePlate() {
    if (!this.schedulePlate) return;
    this.schedulePlate.remove();
  }

  createTimeAndSpotPlate() {
    // TourSpot newSpot
    const timeAndSpotPlate = document.createElement("div");
    timeAndSpotPlate.classList.add("time-and-tourist-spot");

    if (this.id === 1) {
      timeAndSpotPlate.classList.add("start-or-end");
      timeAndSpotPlate.innerHTML = `<img class="place" src="../icon/place2.png" alt="place-marker" />
      <div class="time">
        <p class="start-or-end-time">${this.startTime.text}</p>
        <p class="action">出發</p>
      </div>
  
      <div class="tourist-spot">
        <p class="spot">${this.name}</p>
      </div>`;
    } else {
      timeAndSpotPlate.classList.add("traveling");
      timeAndSpotPlate.innerHTML = `<img class="place" src="../icon/place2.png" alt="place-marker" />
      <div class="time">
        <p class="start-time">${this.startTime.text}</p>
        <p class="to">-</p>
        <p class="end-time">${this.endTime.text}</p>
      </div>
  
      <div class="tourist-spot">
        <p class="spot">${this.name}</p>
        <p class="stay-time">停留${this.duration.text}</p>
        <p class="cost">花費0</p>
      </div>`;
    }

    // Add remove buttom and drag buttom
    timeAndSpotPlate.innerHTML += `<div class="remove-btn">
      <i class="bi bi-trash"></i>
    </div>

    <div class="drag-btn">
      <i class="bi bi-arrows-move"></i>
    </div>`;

    this.schedulePlate.appendChild(timeAndSpotPlate);
  }

  removeTimeAndSpotPlate() {
    const timeAndSpotPlate = this.schedulePlate.querySelector(
      "time-and-tourist-spot"
    );
    if (!timeAndSpotPlate) return;
    timeAndSpotPlate.remove();
  }

  updateTimeAndSpotPlate() {
    if (this.id === 1) {
      const startTimeHTML =
        this.schedulePlate.querySelector(".start-or-end-time");
      startTimeHTML.innerHTML = `${this.startTime.text}`;
    }

    const startTimeHTML = this.schedulePlate.querySelector(".start-time");
    const endTimeHTML = this.schedulePlate.querySelector(".end-time");
    startTimeHTML.innerHTML = `${this.startTime.text}`;
    endTimeHTML.innerHTML = `${this.endTime.text}`;
  }

  createTrafficTimePlate() {
    const trafficTimeDisplay = document.createElement("div");
    trafficTimeDisplay.classList.add("traffic-time");
    trafficTimeDisplay.classList.add(`id-${this.id}`);

    trafficTimeDisplay.innerHTML = `<i class="bi bi-car-front-fill"></i>
    <p>${this.trafficTime.text}</p>`;

    this.schedulePlate.appendChild(trafficTimeDisplay);
  }

  removeTrafficTimePlate() {
    const trafficTimeDisplay =
      this.schedulePlate.querySelector(".traffic-time");
    if (!trafficTimeDisplay) return;
    trafficTimeDisplay.remove();
  }

  updateTrafficTimePlate() {
    const trafficTimeDisplay =
      this.schedulePlate.querySelector(".traffic-time");
    if (!trafficTimeDisplay) return;

    const trafficTimeHTML = trafficTimeDisplay.querySelector("p");
    console.log(trafficTimeDisplay);
    trafficTimeHTML.innerHTML = `${this.trafficTime.text}`;
  }
}

export default TourSpot;
