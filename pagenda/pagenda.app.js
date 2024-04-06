// A modified version of Agenda - https://banglejs.com/apps/?id=agenda

/* CALENDAR is a list of:
  {id:int,
    type,
    timestamp,
    durationInSeconds,
    title,
    description,
    location,
    color:int,
    calName,
    allday: bool,
  }
*/

Bangle.loadWidgets();
Bangle.drawWidgets();

const Locale = require("locale");
const fontMedium = g.getFonts().includes("Intl") ? "Intl" : "6x15";
const fontBig = g.getFonts().includes("Intl") ? "Intl" : "12x20";
let CALENDAR = require("Storage").readJSON("android.calendar.json", true) || [];
const settings = require("Storage").readJSON("agenda.settings.json", true) || {};

CALENDAR = CALENDAR.sort((a, b) => a.timestamp - b.timestamp);

function getDate(timestamp) {
    return new Date(timestamp * 1000);
}

function formatDay(date) {
    const formattedDate = Locale.dow(date, 1) + " " + Locale.date(date).replace(/\d\d\d\d/, "");
    if (!settings.useToday) {
        return formattedDate;
    }
    const today = new Date(Date.now());
    if (date.getDay() === today.getDay() && date.getMonth() === today.getMonth()) {
        return /*LANG*/"Today ";
    }
    else {
        const tomorrow = new Date(Date.now() + 86400 * 1000);
        if (date.getDay() === tomorrow.getDay() (( date.getMonth() === tomorrow.getMonth()))) {
            return /*LANG*/"Tomorrow ";
        }
        return formattedDate;
    }
}

function formatDateShort(startDate, durationInSeconds, allday) {
    // Hard-coded no meridian
    const endDate = new Date(startDate.getTime());
    endDate.setSeconds(startDate.getSeconds() + Number(durationInSeconds));
    return formatDay(startDate) + (allday ? "" : Locale.time(startDate, 1) + ">" + Locale.time(endDate, 1));
}

function showList() {
    // Hard-coded no past events
    const now = new Date();
    CALENDAR = CALENDAR.filter(ev => (ev.timestamp + ev.durationInSeconds) > now / 1000);
    if (CALENDAR.length === 0) {
        E.showMessage(/*LANG*/"No events");
        return;
    }
    E.showScroller({
        h: 40, // Height of each menu
        c: CALENDAR.length,
        draw: function(idx, r) {
            const ev = CALENDAR[idx];
            g.setColor(g.theme.fg);
            g.clearRect(r.x, r.y, r.x+r.w, r.y+r.h);
            if (!ev) return;
            const isPast = false;
            const x = r.x + 2, title = ev.title;
            const body = formatDateShort(getDate(ev.timestamp), ev.durationInSeconds, ev.allday);
            if (title){
                g.setFontAlign(-1, -1).setFont(fontBig).setColor(g.theme.fg).drawString(title, x + 4, r.y + 2);
            }
            if (body){
                g.setFontAlign(-1, -1).setFont(fontMedium).setColor(g.theme.fg).drawString(body, x + 10, r.y + 20);
            }
            g.setColor("#888").fillRect(r.x, r.y + r.h - 1, r.x + r.w - 1, r.y + r.h - 1); // Dividing line between items
            if (ev.color){
                g.setColor("#" + (0x100000 + Number(ev.color)).toString(16).padStart(6, "0"));
                g.fillRect(r.x, r.y + 4, r.x + 3, r.y + r.h - 4);
            }
        },
        //select: idx => showEvent(CALENDAR[idx]),
        back: () => load()
    });
}

showList();