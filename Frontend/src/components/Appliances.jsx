import { useState, useEffect } from "react";
import api from "../api/axios";
import "./Appliances.css";

function Appliances() {

    const [appliances, setAppliances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        applianceName: "",
        room: "",
        powerRating: "",
        priority: "medium"
    });

    //fatch Appliances

    const fetchAppliances = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await api.get("/appliances");

            setAppliances(
                response.data.appliances || []
            );

        } catch (error) {

            console.error(
                "Fetch Appliances Error:",
                error.response?.data || error.message
            );

            setError(
                error.response?.data?.message ||
                "Unable to load appliances"
            );

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {
        fetchAppliances();
    }, []);

    //input change

    const handleChange = (event) => {

        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

    };

    //reset form

    const resetForm = () => {

        setFormData({
            applianceName: "",
            room: "",
            powerRating: "",
            priority: "medium"
        });

        setEditingId(null);
        setShowForm(false);
        setError("");

    };

    //add/ update appliances

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!formData.applianceName || !formData.room || !formData.powerRating) {
            setError("Please fill in all required fields.");

            return;

        }

        if (Number(formData.powerRating) <= 0) {
            setError("Power Rating must be greater then 0");

            return;
        }

        try {

            setSaving(true);

            const data = {
                applianceName: formData.applianceName,
                room: formData.room,
                powerRating: Number(formData.powerRating),
                priority: formData.priority
            };


            if (editingId) {

                await api.put(
                    `/appliances/${editingId}`,
                    data
                );

            } else {

                await api.post(
                    "/appliances",
                    data
                );

            }


            await fetchAppliances();

            resetForm();

        } catch (error) {

            console.error(
                "Save Appliance Error:",
                error.response?.data || error.message
            );

            setError(
                error.response?.data?.message ||
                "Unable to save appliance"
            );

        } finally {

            setSaving(false);

        }

    };

    //edit

    const handleEdit = (appliance) => {

        setFormData({
            applianceName:
                appliance.applianceName,

            room:
                appliance.room,

            powerRating:
                appliance.powerRating,

            priority:
                appliance.priority
        });

        setEditingId(appliance._id);

        setShowForm(true);

        setError("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    };

    //delete

    const handleDelete = async (id) => {

        const confirmed = window.confirm(
            "Are you sure you want to delete this appliance?"
        );

        if (!confirmed) {
            return;
        }


        try {

            await api.delete(
                `/appliances/${id}`
            );

            await fetchAppliances();

        } catch (error) {

            console.error(
                "Delete Appliance Error:",
                error.response?.data || error.message
            );

            setError(
                error.response?.data?.message ||
                "Unable to delete appliance"
            );

        }
    };


    //toggle

    const handleToggle = async (id) => {

        try {

            await api.patch(
                `/appliances/${id}/toggle`
            );

            await fetchAppliances();

        } catch (error) {

            console.error(
                "Toggle Appliance Error:",
                error.response?.data || error.message
            );

            alert(
                error.response?.data?.message ||
                "Unable to change appliance status"
            );

        }
    };


    //total load

    const currentLoad = appliances
        .filter((appliance) => appliance.status)
        .reduce(
            (total, appliance) =>
                total + appliance.powerRating,
            0
        );


    const currentLoadKW =
        currentLoad / 1000;


    const runningCount =
        appliances.filter(
            (appliance) => appliance.status
        ).length;


    // LOADING

    if (loading) {

        return (
            <div className="appliance-loading">

                <div className="loading-spinner"></div>

                <p>
                    Loading your appliances...
                </p>

            </div>
        );
    }


    return (

        <div className="appliances-page">

            {/* ================= HEADER ================= */}

            <div className="appliances-header">

                <div>

                    <span className="page-label">
                        POWER MANAGEMENT
                    </span>

                    <h1>
                        My Appliances
                    </h1>

                    <p>
                        Manage and monitor all your
                        electrical appliances.
                    </p>

                </div>


                <button
                    className="add-appliance-btn"
                    onClick={() => {

                        setShowForm(!showForm);

                        if (editingId) {
                            resetForm();
                        }

                    }}
                >
                    {showForm
                        ? "✕ Close"
                        : "+ Add Appliance"}
                </button>

            </div>


            {/* ================= ERROR ================= */}

            {error && (

                <div className="appliance-error">
                    ⚠️ {error}
                </div>

            )}


            {/* ================= SUMMARY ================= */}

            <div className="appliance-summary">

                <div className="summary-box">

                    <span>Total Appliances</span>

                    <strong>
                        {appliances.length}
                    </strong>

                </div>


                <div className="summary-box">

                    <span>Currently Running</span>

                    <strong>
                        {runningCount}
                    </strong>

                </div>


                <div className="summary-box">

                    <span>Current Load</span>

                    <strong>
                        {currentLoadKW.toFixed(2)} kW
                    </strong>

                </div>


                <div className="summary-box">

                    <span>Available Capacity</span>

                    <strong>
                        {Math.max(
                            5 - currentLoadKW,
                            0
                        ).toFixed(2)} kW
                    </strong>

                </div>

            </div>


            {/* ================= FORM ================= */}

            {showForm && (

                <div className="appliance-form-card">

                    <div className="form-heading">

                        <div>

                            <span className="page-label">
                                {editingId
                                    ? "EDIT APPLIANCE"
                                    : "NEW APPLIANCE"}
                            </span>

                            <h2>
                                {editingId
                                    ? "Update Appliance"
                                    : "Add Appliance"}
                            </h2>

                        </div>

                    </div>


                    <form
                        onSubmit={handleSubmit}
                        className="appliance-form"
                    >

                        <div className="input-group">

                            <label>
                                Appliance Name
                            </label>

                            <input
                                type="text"
                                name="applianceName"
                                placeholder="e.g. Air Conditioner"
                                value={
                                    formData.applianceName
                                }
                                onChange={handleChange}
                            />

                        </div>


                        <div className="input-group">

                            <label>
                                Room
                            </label>

                            <input
                                type="text"
                                name="room"
                                placeholder="e.g. Bedroom"
                                value={
                                    formData.room
                                }
                                onChange={handleChange}
                            />

                        </div>


                        <div className="input-group">

                            <label>
                                Power Rating
                            </label>

                            <div className="power-input">

                                <input
                                    type="number"
                                    name="powerRating"
                                    min="1"
                                    placeholder="e.g. 1500"
                                    value={
                                        formData.powerRating
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                                <span>
                                    Watts
                                </span>

                            </div>

                        </div>


                        <div className="input-group">

                            <label>
                                Priority
                            </label>

                            <select
                                name="priority"
                                value={
                                    formData.priority
                                }
                                onChange={
                                    handleChange
                                }
                            >

                                <option value="high">
                                    High
                                </option>

                                <option value="medium">
                                    Medium
                                </option>

                                <option value="low">
                                    Low
                                </option>

                            </select>

                        </div>


                        <div className="form-buttons">

                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="save-btn"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "Update Appliance"
                                        : "Add Appliance"}
                            </button>

                        </div>

                    </form>

                </div>

            )}


            {/* ================= APPLIANCE LIST ================= */}

            <div className="list-header">

                <div>

                    <span className="page-label">
                        YOUR DEVICES
                    </span>

                    <h2>
                        Appliance List
                    </h2>

                </div>

            </div>


            {appliances.length === 0 ? (

                <div className="empty-appliances">

                    <div className="empty-icon">
                        🔌
                    </div>

                    <h2>
                        No appliances added
                    </h2>

                    <p>
                        Add your first appliance to
                        start monitoring your energy.
                    </p>

                    <button
                        onClick={() =>
                            setShowForm(true)
                        }
                    >
                        + Add Your First Appliance
                    </button>

                </div>

            ) : (

                <div className="appliance-list">

                    {appliances.map(
                        (appliance) => (

                            <div
                                className="appliance-item"
                                key={appliance._id}
                            >

                                <div className="item-icon">
                                    ⚡
                                </div>


                                <div className="item-main">

                                    <h3>
                                        {
                                            appliance.applianceName
                                        }
                                    </h3>

                                    <p>
                                        🏠 {appliance.room}
                                    </p>

                                </div>


                                <div className="item-power">

                                    <strong>
                                        {
                                            appliance.powerRating
                                        } W
                                    </strong>

                                    <span>
                                        Power Rating
                                    </span>

                                </div>


                                <div className="item-priority">

                                    <span
                                        className={`priority ${appliance.priority}`}
                                    >
                                        {
                                            appliance.priority
                                        }
                                    </span>

                                </div>


                                <div className="item-status">

                                    <span
                                        className={
                                            appliance.status
                                                ? "status-badge on"
                                                : "status-badge off"
                                        }
                                    >
                                        <span></span>

                                        {appliance.status
                                            ? "Running"
                                            : "Off"}
                                    </span>

                                </div>


                                <div className="item-actions">

                                    <button
                                        className={
                                            appliance.status
                                                ? "action-toggle off-btn"
                                                : "action-toggle on-btn"
                                        }
                                        onClick={() =>
                                            handleToggle(
                                                appliance._id
                                            )
                                        }
                                    >
                                        {appliance.status
                                            ? "Turn OFF"
                                            : "Turn ON"}
                                    </button>


                                    <button
                                        className="edit-btn"
                                        onClick={() =>
                                            handleEdit(
                                                appliance
                                            )
                                        }
                                    >
                                        Edit
                                    </button>


                                    <button
                                        className="delete-btn"
                                        onClick={() =>
                                            handleDelete(
                                                appliance._id
                                            )
                                        }
                                    >
                                        Delete
                                    </button>

                                </div>

                            </div>

                        )
                    )}

                </div>

            )}

        </div>
    );

};


export default Appliances;

