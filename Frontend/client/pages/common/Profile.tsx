// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import useLogout from "../hooks/Logout";
import { Layout } from "@/components/Layout";
import { FaBuilding, FaUserTie, FaLayerGroup, FaEnvelope } from "react-icons/fa";


const Profile = () => {
    // State to hold the fetched user data
    const [userData, setUserData] = useState<any>(null);
    // State to track loading status
    const [loading, setLoading] = useState(true);
    // State to track any errors during fetching
    const [error, setError] = useState('');
    // Hook to navigate programmatically
    const navigate = useNavigate();

    // const logout = useLogout();

    useEffect(() => {
        const fetchUserData = async () => {
            // Get the access token from localStorage
            const accessToken = localStorage.getItem('access_token');

            if (!accessToken) {
                // If there's no token, the user is not authenticated.
                // Redirect them to the login page.
                navigate('/login');
                return;
            }

            try {
                // Your backend's protected user data API endpoint
                const response = await fetch('http://127.0.0.1:8000/api/auth/profile/', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`, // Use the access token for authentication
                    },
                });

                if (!response.ok) {
                    // If the token is expired or invalid, handle the error
                    throw new Error('Failed to fetch user data. Token might be expired.');
                }

                const data = await response.json();
                setUserData(data); // Store the fetched data in state
                console.log(data);
            } catch (err) {
                console.error('User data fetch error:', err);
                setError(err.message || 'An error occurred while fetching user data.');
                // You might want to log the user out if the token is bad
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                navigate('/login'); // Redirect to login
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]); // Add 'navigate' to the dependency array

    if (loading) {
        return <div>Loading user data...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>Error: {error}</div>;
    }

    if (!userData) {
        return <div>No user data found. Please log in.</div>;
    }

    // Render the user data
    return (

        <Layout>
            <div className="relative overflow-auto w-full min-h-screen flex flex-col gap-6">

                {/* Page Title */}
                <div>
                    <h1 className="font-semibold text-[#1c1f37] text-2xl mb-2">
                        Profile
                    </h1>
                </div>

                {/* Main Content */}



                <main className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
                    {/* Header Section */}
                    <div className="flex flex-col items-center mb-10">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-blue-500 text-white flex items-center justify-center text-5xl font-bold shadow-lg">
                            {userData.username?.charAt(0).toUpperCase()}
                        </div>

                        {/* Name & Email */}
                        <h1 className="text-3xl font-semibold mt-4">{userData.first_name} {userData.last_name}</h1>
                        <p className="text-gray-500 mt-1 flex items-center gap-2">
                            <FaEnvelope className="text-gray-400" /> {userData.email}
                        </p>

                        {/* Logout Button */}
                        <button className="mt-4 bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition">
                            Log Out
                        </button>
                    </div>

                    {/* Details Section */}
                    <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-6 divide-y divide-gray-200">
                        {/* Username */}
                        <div className="flex justify-between py-3 items-center">
                            <span className="text-gray-500 font-medium">Username</span>
                            <span className="text-gray-800">{userData.username}</span>
                        </div>

                        {/* Employee ID */}
                        <div className="flex justify-between py-3 items-center">
                            <span className="text-gray-500 font-medium">Employee ID</span>
                            <span className="text-gray-800">{userData.employee_id}</span>
                        </div>

                        {/* Grade */}
                        <div className="flex justify-between py-3 items-center">
                            <span className="text-gray-500 font-medium">Grade</span>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium 
                       hover:scale-105 transition transform cursor-pointer">
                                {userData.grade}
                            </span>
                        </div>

                        {/* Employee Type */}
                        <div className="flex justify-between py-3 items-center">
                            <span className="text-gray-500 font-medium">Employee Type</span>
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium 
                       hover:scale-105 transition transform cursor-pointer">
                                {userData.employee_type}
                            </span>
                        </div>

                        {/* Department */}
                        <div className="flex justify-between py-3 items-center">
                            <span className="text-gray-500 font-medium flex items-center gap-2">
                                <FaBuilding className="text-gray-400" /> Department
                            </span>
                            <span className="text-gray-800">{userData.department}</span>
                        </div>

                        {/* Designation */}
                        <div className="flex justify-between py-3 items-center">
                            <span className="text-gray-500 font-medium flex items-center gap-2">
                                <FaUserTie className="text-gray-400" /> Designation
                            </span>
                            <span className="text-gray-800">{userData.designation}</span>
                        </div>

                        {/* Roles */}
                        <div className="flex justify-between py-3 items-start">
                            <span className="text-gray-500 font-medium flex items-center gap-2">
                                <FaLayerGroup className="text-gray-400" /> Roles
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {userData.roles?.map((role: string, idx: number) => (
                                    <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium 
                                     hover:scale-105 transition transform cursor-pointer">
                                        {role.name}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Company */}
                        <div className="flex justify-between py-3 items-center">
                            <span className="text-gray-500 font-medium flex items-center gap-2">
                                <FaBuilding className="text-gray-400" /> Company
                            </span>
                            <span className="text-gray-800">{userData.company}</span>
                        </div>
                    </div>
                </main>



            </div>
        </Layout>
    );
};

export default Profile;