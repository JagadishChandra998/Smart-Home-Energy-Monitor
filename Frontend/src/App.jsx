import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./components/Login.jsx";
import Home from "./components/Home.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Appliances from "./components/Appliances.jsx";
import Schedule from "./components/Schedule.jsx";


function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Default URL */}
                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />

                {/* Public route */}
                <Route
                    path="/login"
                    element={<Login />}
                />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>

                    <Route
                        path="/home"
                        element={
                            <Home />
                        }
                    />

                    <Route
                        path="/appliances"
                        element={<Appliances />}
                    />
                    <Route
                        path="/schedule"
                        element={<Schedule />}
                    />

                </Route>

            </Routes>
        </BrowserRouter>
    );
}

export default App;