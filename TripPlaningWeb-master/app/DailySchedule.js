import TourSpot from "./TourSpot.js";

class DailySchedule {
  head;
  tail;
  length;
  addPlaceForm;

  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
    this.addPlaceForm = document.querySelector(".add-place-form");
  }

  isEmpty() {
    return this.length === 0;
  }

  getNode(index) {
    // Return the pointer of the node at the specific index
    if (index > this.length) {
      return null;
    } else {
      let current = this.head;
      for (let i = 1; i < index; i++) {
        current = current.next;
      }
      return current;
    }
  }

  append(name, pos) {
    /*  ***********************************
        INPUT:
        string name: Name of the new tourist spot
        googleMapPositionObj pos: Position of the new tourist spot
  
        FUNCTIONS:
        Append a new tourist spot at the end of the schedule.
        ***********************************************/

    let newSpot = new TourSpot(name, pos, this.length + 1);
    if (this.isEmpty()) {
      this.head = newSpot;
      this.tail = newSpot;
    } else {
      // Update the tail pointer
      this.tail.next = newSpot;
      newSpot.prev = this.tail;
      this.tail = newSpot;
    }
    this.length += 1;
  }

  pop() {
    if (!this.head) return undefined;

    let current = this.tail;
    if (this.length === 1) {
      this.head = null;
      this.tail = null;
    } else {
      this.tail = current.prev;
      this.tail.next = null;
      current.prev = null;
    }
    this.length -= 1;
  }

  remove(index) {
    /*  ***********************************
        INPUT:
        int index: Index of the spot you want to remove.
  
        FUNCTIONS:
        Remove the spot (including the marker) at the index you specified.
        ***********************************************/

    if (index > this.length || index < 1) return undefined;

    let current = this.getNode(index);

    if (current === this.head) {
      this.head = this.head.next;
      this.head.prev = null;
      current.next = null;
      this.length -= 1;
    } else if (current === this.tail) {
      this.pop();
    } else {
      current.prev.next = current.next;
      current.next.prev = current.prev;
      current.next = null;
      current.prev = null;
      this.length -= 1;
    }
  }

  async appendNewSpot(spotName, spotPos, map) {
    // Create a new spot at the end
    this.append(spotName, spotPos);

    // Set current as the spot just created
    const current = this.tail;
    const prev = this.tail.prev;

    // Route and traffic time calculation from  PREVIOUS SPOT
    if (this.length >= 2) {
      // Calculate the route
      await prev.calRouteAndTrafficTime();

      // Display the route
      prev.displayRoute(map);

      // Display the traffic time
      prev.createTrafficTimePlate();
    }

    // Disaplay the newly add spot
    current.newMark(map);

    // Generate the time schedule on the left
    current.setStartTime(this.addPlaceForm);
    current.setDuration(this.addPlaceForm);
    current.setEndTime();
    current.createSchedulePlate();
    current.createTimeAndSpotPlate();

    // Make the remove buttom work on the schedule plate
    const removeBtn = current.schedulePlate.querySelector(".remove-btn");
    removeBtn.addEventListener("click", () => {
      this.removeSpot(current.id, map);
    });
  }

  async removeSpot(index, map) {
    const current = this.getNode(index);

    if (current == null) return;
    if (current === this.head) {
      window.alert("不可以刪除起點站！");
      return;
    }

    // Definition:
    // current: Curent spot
    // current.prev: Also called PREV, one step behine current spot
    // current.next: Also called NEXT, one step ahead of current spot
    const prev = current.prev;

    // Remove the schedule plate
    current.removeSchedulePlate();

    // Remove the mark
    current.removeMark();

    // Undisplay the route
    current.undisplayRoute();
    prev.undisplayRoute();
    console.log("undisplayRoute() finished");

    // Remove the wanted spot from the memory
    this.remove(current.id);
    console.log("remove() finished");

    // Recalculate id and update to the map indication
    this.recalculateIdAndUpdateToMap();
    console.log("recalculateIdAndUpdateToMap() finished");

    //  PREV: Recalculate route and traffic time
    //  NEXT: Recalcultat start time and end time
    if (prev.next != null) {
      // Recalculate the route
      await prev.calRouteAndTrafficTime();

      // Redisplay the route
      prev.displayRoute(map);

      // Update the traffic time indication
      prev.updateTrafficTimePlate();

      // Update the start time and end time
      prev.next.updateStartTime();
      prev.next.updateEndTime();

      // Update the schedule plate accordingly
      prev.next.updateTimeAndSpotPlate();
    } else {
      prev.removeTrafficTimePlate();
    }
  }

  recalculateIdAndUpdateToMap() {
    let id = 1;
    console.log("In recalculateIdAndUpdateToMap()");

    this.traverseAll((current) => {
      console.log(`id = ${id}`);
      console.log(`Spot name = ${current.name}`);
      current.id = id;
      current.updateMarkId(id);
      id += 1;
    });
  }

  traverseAll(callbackFn) {
    let current = this.head;
    while (current) {
      callbackFn(current);
      current = current.next;
    }
  }

  // NOTE: Add place form 不屬於任何一個TourSpot，所以由DailySchedule控制

  openAddPlaceForm() {
    let conformAddBtn = this.addPlaceForm.querySelector(".conform-add");
    let fillInStartTime = this.addPlaceForm.querySelector(
      ".fill-in-start-time"
    );
    let fillInDuration = this.addPlaceForm.querySelector(".fill-in-duration");

    conformAddBtn.style.display = "block";
    if (this.length === 0) {
      fillInStartTime.style.display = "block";
    } else {
      fillInDuration.style.display = "block";
    }
  }

  closeAddPlaceForm() {
    let conformAddBtn = this.addPlaceForm.querySelector(".conform-add");
    let fillInStartTime = this.addPlaceForm.querySelector(
      ".fill-in-start-time"
    );
    let fillInDuration = this.addPlaceForm.querySelector(".fill-in-duration");

    conformAddBtn.style.display = "none";
    fillInStartTime.style.display = "none";
    fillInDuration.style.display = "none";
  }
}

export default DailySchedule;
