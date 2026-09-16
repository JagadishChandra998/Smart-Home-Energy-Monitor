import { useEffect, useState } from "react";
import api from "../api/axios.js";
import "./Schedule.css";

function Schedule() {

    const [schedules, setSchedules] = useState([]);
    const [appliances, setAppliances] = useState([]);

    // const now = new Date();
    // const currentTime = now.toLocaleDateString().slice(0,5);

    const [form, setForm] = useState({
        applianceId: "",
        days: [],
        startTime: "",
        endTime: ""
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // GET APPLIANCES

    const fetchAppliances = async () => {
        try {

            const response = await api.get("/appliances");
            console.log("SCHEDULES:", response.data);

            setAppliances(response.data.appliances || []);

        } catch (error) {

            console.error(
                "Appliance Error:",
                error.response?.data || error.message
            );
        }
    };

    // GET SCHEDULES

    const fetchSchedules = async () => {

        try {

            const response =
                await api.get("/schedules");

            setSchedules(
                response.data.schedules || []
            );

        } catch (error) {

            console.error(
                "Schedule Error:",
                error.response?.data || error.message
            );

            setError(
                error.response?.data?.message ||
                "Unable to load schedules"
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {

        fetchAppliances();
        fetchSchedules();

    }, []);

    // FORM CHANGE

    const handleChange = (event) => {

        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));

    };

    //handel check box
    const handleDayChange = (day) => {
        setForm((previous) => {
            const alreadySelected = previous.days.includes(day);

            return {
                ...previous,
                days: alreadySelected
                    ? previous.days.filter((item) => item !== day)
                    : [...previous.days, day]
            };
        });
    };

    const handleAllDays = (event) => {
        if (event.target.checked) {
            setForm((previous) => ({
                ...previous,
                days: [...days]
            }));
        } else {
            setForm((previous) => ({
                ...previous,
                days: []
            }));
        }
    };

    // CREATE SCHEDULE

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");

        if (
            !form.applianceId ||
            form.days.length === 0 ||
            !form.startTime ||
            !form.endTime
        ) {

            setError(
                "Please select an appliance, at least one day, start time and end time."
            );

            return;
        }


        if (form.startTime === form.endTime) {

            setError(
                "Start time and end time cannot be the same."
            );

            return;
        }


        try {

            setSaving(true);

            await api.post(
                "/schedules",
                form
            );


            setForm({
                applianceId: "",
                days: [],
                startTime: "",
                endTime: ""
            });



            await fetchSchedules();

        } catch (error) {

            console.error(
                "Create Schedule Error:",
                error.response?.data || error.message
            );

            setError(
                error.response?.data?.message ||
                "Unable to create schedule"
            );

        } finally {

            setSaving(false);

        }
    };

    // DELETE

    const deleteSchedule = async (id) => {

        const confirmDelete =
            window.confirm(
                "Are you sure you want to delete this schedule?"
            );

        if (!confirmDelete) return;


        try {

            await api.delete(
                `/schedules/${id}`
            );

            await fetchSchedules();

        } catch (error) {

            console.error(
                "Delete Schedule Error:",
                error.response?.data || error.message
            );

        }
    };

    // ENABLE / DISABLE

    const toggleSchedule = async (id) => {

        try {

            await api.patch(
                `/schedules/${id}/toggle`
            );

            await fetchSchedules();

        } catch (error) {

            console.error(
                "Toggle Schedule Error:",
                error.response?.data || error.message
            );

        }
    };

    const days = [...Array(7)].map((_, i) =>
        new Date(2024, 0, i + 1).toLocaleDateString("en-US", {
            weekday: "long"
        })
    );

    // const days = [
    //     "Sunday",
    //     "Monday",
    //     "Tuesday",
    //     "Wednesday",
    //     "Thursday",
    //     "Friday",
    //     "Saturday"
    // ];

    // const today = new Date().toLocaleDateString("en", { weekday: "long" });

    const getSchedulesForDay = (day) => {
        return schedules.filter((schedule) => schedule.day === day);
    };

    if (loading) {

        return (
            <div className="schedule-loading">
                Loading schedules...
            </div>
        );
    }


    return (

        <div className="schedule-page">

            {/* HEADER */}

            <div className="schedule-header">

                <div>

                    <p className="schedule-label">
                        SMART ENERGY
                    </p>

                    <h1>
                        Schedule & Timetable
                    </h1>

                    <p>
                        Automatically manage your appliances
                        according to your daily schedule.
                    </p>

                </div>

                <div className="schedule-count">

                    <strong>
                        {schedules.length}
                    </strong>

                    <span>
                        Active Schedules
                    </span>

                </div>

            </div>


            {/* CREATE SCHEDULE */}

            <div className="schedule-create-card">

                <div className="card-title">

                    <h2>
                        Create Schedule
                    </h2>

                    <p>
                        Choose when your appliance should run.
                    </p>

                </div>


                <form
                    className="schedule-form"
                    onSubmit={handleSubmit}
                >

                    <div className="form-group">

                        <label>
                            Appliance
                        </label>

                        <select
                            name="applianceId"
                            value={form.applianceId}
                            onChange={handleChange}
                        >

                            <option value="">
                                Select appliance
                            </option>

                            {appliances.map(
                                (appliance) => (

                                    <option
                                        key={appliance._id}
                                        value={appliance._id}
                                    >
                                        {appliance.applianceName}
                                        {" - "}
                                        {appliance.powerRating}W
                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    {/* <div className="form-group">

                        <label>
                            Day
                        </label>

                        <select
                            name="day"
                            value={form.day}
                            onChange={handleChange}
                        >

                            <option value="">
                                {today}
                            </option>
                            {
                                days.map((day) => (
                                    <option key={day} value={day}>
                                        {day}
                                    </option>
                                ))
                            }
                        </select>

                    </div> */}

                    <div className="form-group schedule-days-group">

                        <label>Days</label>

                        <label className="all-days-checkbox">
                            <input
                                type="checkbox"
                                checked={form.days.length === days.length}
                                onChange={handleAllDays}
                            />

                            <span>All Days</span>
                        </label>

                        <div className="days-checkboxes">

                            {days.map((day) => (
                                <label
                                    key={day}
                                    className="day-checkbox"
                                >
                                    <input
                                        type="checkbox"
                                        value={day}
                                        checked={form.days.includes(day)}
                                        onChange={() => handleDayChange(day)}
                                    />

                                    <span>{day}</span>
                                </label>
                            ))}

                        </div>

                    </div>


                    <div className="form-group">

                        <label>
                            Start Time
                        </label>

                        <input
                            type="time"
                            name="startTime"
                            value={form.startTime}
                            onChange={handleChange}

                        />

                    </div>


                    <div className="form-group">

                        <label>
                            End Time
                        </label>

                        <input
                            type="time"
                            name="endTime"
                            value={form.endTime}
                            onChange={handleChange}
                        />

                    </div>


                    <button
                        type="submit"
                        disabled={saving}
                        className="create-schedule-button"
                    >
                        {saving
                            ? "Creating..."
                            : "+ Create Schedule"}

                    </button>

                </form>


                {error && (

                    <p className="schedule-error">
                        {error}
                    </p>

                )}

            </div>


            {/* SCHEDULE LIST */}

            <div className="schedule-list-section">

                <div className="section-heading">

                    <div>

                        <h2>
                            My Schedules
                        </h2>

                        <p>
                            Your appliance automation timetable
                        </p>

                    </div>

                </div>


                {schedules.length === 0 ? (

                    <div className="empty-schedule">

                        <div className="empty-icon">
                            🕐
                        </div>

                        <h3>
                            No schedules yet
                        </h3>

                        <p>
                            Create your first appliance
                            schedule above.
                        </p>

                    </div>

                ) : (

                    <div className="schedule-grid">

                        {schedules.map(
                            (schedule) => (

                                <div
                                    className={`schedule-card ${schedule.enabled
                                        ? ""
                                        : "schedule-disabled"
                                        }`}
                                    key={schedule._id}
                                >

                                    <div className="schedule-card-top">

                                        <div>

                                            <h3>
                                                {schedule.applianceId
                                                    ?.applianceName ||
                                                    "Unknown Appliance"}
                                            </h3>

                                            <span>
                                                {schedule.applianceId
                                                    ?.room ||
                                                    "Unknown room"}
                                            </span>

                                        </div>


                                        {/* <button
                                            className={`schedule-status ${
                                                schedule.enabled
                                                    ? "enabled"
                                                    : "disabled"
                                            }`}
                                            onClick={() =>
                                                toggleSchedule(
                                                    schedule._id
                                                )
                                            }
                                        >

                                            {schedule.enabled
                                                ? "ON"
                                                : "OFF"}

                                        </button> */}

                                        <div className="schedule-control">

                                            <span className="schedule-control-label">
                                                {schedule.enabled ? "Enabled" : "Disabled"}
                                            </span>

                                            <button
                                                type="button"
                                                className={`schedule-switch ${schedule.enabled ? "active" : ""
                                                    }`}
                                                onClick={() =>
                                                    toggleSchedule(schedule._id)
                                                }
                                                aria-label={
                                                    schedule.enabled
                                                        ? "Disable schedule"
                                                        : "Enable schedule"
                                                }
                                            >
                                                <span className="schedule-switch-knob"></span>
                                            </button>

                                        </div>

                                    </div>


                                    <div className="schedule-time">

                                        <div>

                                            <span>
                                                START
                                            </span>

                                            <strong>
                                                {schedule.startTime}
                                            </strong>

                                        </div>


                                        <div className="arrow">
                                            →
                                        </div>


                                        <div>

                                            <span>
                                                END
                                            </span>

                                            <strong>
                                                {schedule.endTime}
                                            </strong>

                                        </div>

                                    </div>


                                    <div className="schedule-details">

                                        <span>
                                            📅 {schedule.day}
                                        </span>

                                        <span>
                                            ⚡{" "}
                                            {schedule.applianceId
                                                ?.powerRating ||
                                                0}
                                            W
                                        </span>

                                        <span>
                                            🎯{" "}
                                            {schedule.applianceId
                                                ?.priority ||
                                                "medium"}
                                        </span>

                                    </div>


                                    <button
                                        className="delete-schedule"
                                        onClick={() =>
                                            deleteSchedule(
                                                schedule._id
                                            )
                                        }
                                    >
                                        Delete Schedule
                                    </button>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>

            {/* WEEKLY TIMETABLE */}

            <div className="timetable-section">

                <div className="section-heading">

                    <div>
                        <h2>
                            Weekly Timetable
                        </h2>

                        <p>
                            View all your appliance schedules for the week.
                        </p>
                    </div>

                </div>


                <div className="timetable">

                    {days.map((day) => (

                        <div
                            className="timetable-day"
                            key={day}
                        >

                            <div className="timetable-day-header">

                                <strong>
                                    {day}
                                </strong>

                                <span>
                                    {
                                        getSchedulesForDay(day).length
                                    } schedules
                                </span>

                            </div>


                            <div className="timetable-events">

                                {getSchedulesForDay(day).length === 0 ? (

                                    <div className="no-schedule">
                                        No schedules
                                    </div>

                                ) : (

                                    getSchedulesForDay(day).map(
                                        (schedule) => (

                                            <div
                                                className={`timetable-event ${schedule.enabled
                                                    ? ""
                                                    : "event-disabled"
                                                    }`}
                                                key={schedule._id}
                                            >

                                                <div className="event-time">

                                                    <strong>
                                                        {schedule.startTime}
                                                    </strong>

                                                    <span>
                                                        →
                                                    </span>

                                                    <strong>
                                                        {schedule.endTime}
                                                    </strong>

                                                </div>


                                                <div className="event-appliance">

                                                    <strong>
                                                        {schedule.applianceId
                                                            ?.applianceName ||
                                                            "Unknown Appliance"}
                                                    </strong>

                                                    <span>
                                                        ⚡{" "}
                                                        {schedule.applianceId
                                                            ?.powerRating ||
                                                            0}
                                                        W
                                                    </span>

                                                </div>


                                                <span
                                                    className={`event-status ${schedule.enabled
                                                        ? "event-enabled"
                                                        : "event-disabled-status"
                                                        }`}
                                                >
                                                    {schedule.enabled
                                                        ? "Enabled"
                                                        : "Disabled"}
                                                </span>

                                            </div>

                                        )
                                    )

                                )}

                            </div>

                        </div>

                    ))}

                </div>

            </div>

        </div>


    );
}

export default Schedule;