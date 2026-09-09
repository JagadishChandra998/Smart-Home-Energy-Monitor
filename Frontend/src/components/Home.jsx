import api from "../api/axios.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {

    const navigate = useNavigate();

    const [appliances, setAppliances] = useState([]);
    const [liveLoad, setLiveLoad] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchHomeData = async () => {

        try {

            const applianceResponse = await api.get(
                "/appliances"
            );

            const loadResponse = await api.get(
                "/appliances/live-load"
            );

            setAppliances(
                applianceResponse.data.appliances || []
            );

            setLiveLoad(loadResponse.data);

        } catch (error) {

            console.error(
                "Home Error:",
                error.response?.data || error.message
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {

        fetchHomeData();

    }, []);


    const toggleAppliance = async (id) => {

        try {

            await api.patch(
                `/appliances/${id}/toggle`
            );

            await fetchHomeData();

        } catch (error) {

            console.error(
                "Toggle Error:",
                error.response?.data || error.message
            );

            alert(
                error.response?.data?.message ||
                "Unable to change appliance status"
            );

        }

    };


    const handleLogout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("role");

        navigate("/login", {
            replace: true
        });

    };


    if (loading) {

        return (
            <div className="home-loading">
                <div className="loading-spinner"></div>
                <p>Loading your energy dashboard...</p>
            </div>
        );

    }


    const currentLoad =
        liveLoad?.currentLoadPerKW || 0;

    const maximumLoad =
        liveLoad?.maximumLoad / 1000 || 5;

    const remainingLoad =
        liveLoad?.remainingLoad ||
        Math.max(maximumLoad - currentLoad, 0);

    const usagePercentage =
        liveLoad?.usagePercentage ||
        Math.min(
            (currentLoad / maximumLoad) * 100,
            100
        );

    const runningAppliances =
        appliances.filter(
            appliance => appliance.status
        ).length;


    return (

        <div className="home-page">

            {/* ================= NAVBAR ================= */}

            <header className="home-navbar">

                <div
                    className="brand"
                    onClick={() => navigate("/home")}
                >
                    <div className="brand-icon">
                        ⚡
                    </div>

                    <div>
                        <h2>SmartEnergy</h2>
                        <span>Power Management</span>
                    </div>
                </div>


                <div className="navbar-actions">

                    <button
                        onClick={() =>
                            navigate("/appliances")
                        }
                    >
                        Appliances
                    </button>

                    <button
                        onClick={() =>
                            navigate("/timetable")
                        }
                    >
                        Schedule
                    </button>

                    <button
                        onClick={() =>
                            navigate("/history")
                        }
                    >
                        History
                    </button>

                    <button
                        onClick={() =>
                            navigate("/bill")
                        }
                    >
                        Bill
                    </button>

                    <button
                        onClick={() =>
                            navigate("/profile")
                        }
                    >
                        Profile
                    </button>

                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </header>


            {/* ================= MAIN ================= */}

            <main className="home-container">

                <section className="welcome-section">

                    <div>

                        <p className="welcome-label">
                            ENERGY OVERVIEW
                        </p>

                        <h1>
                            Good to see you 👋
                        </h1>

                        <p>
                            Monitor and manage your
                            electricity usage intelligently.
                        </p>

                    </div>

                </section>


                {/* ================= LIVE LOAD ================= */}

                <section className="live-load-card">

                    <div className="load-card-header">

                        <div>

                            <span className="section-label">
                                LIVE POWER LOAD
                            </span>

                            <h2>
                                ⚡ Current Consumption
                            </h2>

                        </div>

                        <div className="live-indicator">
                            <span></span>
                            LIVE
                        </div>

                    </div>


                    <div className="load-main">

                        <div className="load-number">
                            {currentLoad.toFixed(2)}
                            <span> kW</span>
                        </div>

                        <div className="load-limit">
                            of {maximumLoad.toFixed(2)} kW
                            limit
                        </div>

                    </div>


                    <div className="load-progress">

                        <div
                            className="load-progress-fill"
                            style={{
                                width: `${Math.min(
                                    liveLoad.usagePercentage,
                                    100
                                )}%`
                                // `${usagePercentage}%`
                            }}
                        ></div>

                    </div>


                    <div className="load-details">

                        <div>
                            <span>Used</span>
                            <strong>
                                {currentLoad.toFixed(2)} kW
                            </strong>
                        </div>

                        <div>
                            <span>Remaining</span>
                            <strong>
                                {remainingLoad.toFixed(2)} kW
                            </strong>
                        </div>

                        <div>
                            <span>Usage</span>
                            <strong>
                                {usagePercentage.toFixed(1)}%
                            </strong>
                        </div>

                    </div>

                </section>


                {/* ================= SUMMARY ================= */}

                <section className="summary-grid">

                    <div className="summary-card">

                        <div className="summary-icon">
                            🔌
                        </div>

                        <div>
                            <span>
                                Running Appliances
                            </span>

                            <strong>
                                {runningAppliances}
                            </strong>
                        </div>

                    </div>


                    <div className="summary-card">

                        <div className="summary-icon">
                            ⚡
                        </div>

                        <div>
                            <span>
                                Current Load
                            </span>

                            <strong>
                                {currentLoad.toFixed(2)} kW
                            </strong>
                        </div>

                    </div>


                    <div className="summary-card">

                        <div className="summary-icon">
                            🏠
                        </div>

                        <div>
                            <span>
                                Total Appliances
                            </span>

                            <strong>
                                {appliances.length}
                            </strong>
                        </div>

                    </div>

                </section>


                {/* ================= APPLIANCES ================= */}

                <section className="appliances-section">

                    <div className="section-heading">

                        <div>

                            <span className="section-label">
                                YOUR DEVICES
                            </span>

                            <h2>
                                Appliances
                            </h2>

                        </div>

                        <button
                            className="view-all-btn"
                            onClick={() =>
                                navigate("/appliances")
                            }
                        >
                            View All →
                        </button>

                    </div>


                    <div className="appliance-grid">

                        {appliances.length === 0 ? (

                            <div className="empty-state">

                                <div>
                                    🔌
                                </div>

                                <h3>
                                    No appliances yet
                                </h3>

                                <p>
                                    Add your first appliance
                                    to start monitoring
                                    your energy.
                                </p>

                                <button
                                    onClick={() =>
                                        navigate(
                                            "/appliances"
                                        )
                                    }
                                >
                                    + Add Appliance
                                </button>

                            </div>

                        ) : (

                            appliances.slice(0, 6).map(
                                (appliance) => (

                                    <div
                                        className="appliance-card"
                                        key={appliance._id}
                                    >

                                        <div className="appliance-top">

                                            <div className="appliance-icon">
                                                ⚡
                                            </div>

                                            <span
                                                className={
                                                    appliance.status
                                                        ? "status on"
                                                        : "status off"
                                                }
                                            >
                                                {appliance.status
                                                    ? "ON"
                                                    : "OFF"}
                                            </span>

                                        </div>


                                        <h3>
                                            {
                                                appliance.applianceName
                                            }
                                        </h3>


                                        <p className="room">
                                            🏠 {appliance.room}
                                        </p>


                                        <div className="appliance-power">

                                            <strong>
                                                {
                                                    appliance.powerRating
                                                } W
                                            </strong>

                                            <span>
                                                Priority:{" "}
                                                {
                                                    appliance.priority
                                                }
                                            </span>

                                        </div>


                                        <button
                                            className={
                                                appliance.status
                                                    ? "toggle-btn turn-off"
                                                    : "toggle-btn turn-on"
                                            }
                                            onClick={() =>
                                                toggleAppliance(
                                                    appliance._id
                                                )
                                            }
                                        >
                                            {appliance.status
                                                ? "Turn OFF"
                                                : "Turn ON"}
                                        </button>

                                    </div>

                                )
                            )

                        )}

                    </div>

                </section>

            </main>

        </div>
    );
}

export default Home;