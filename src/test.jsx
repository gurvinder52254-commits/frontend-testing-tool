import React, { useState } from "react";
import "./test.css";
import Header from "./components/Header";

function Test() {
    const [showExtra, setShowExtra] = useState(false);

    const [form2, setForm2] = useState({
        name: "",
        email: "",
    });

    const [form3, setForm3] = useState({
        location: "",
        number: "",
    });

    // Separate error states per form
    const [errorsForm2, setErrorsForm2] = useState({});
    const [errorsForm3, setErrorsForm3] = useState({});

    const handleChange = (e, formName) => {
        const { name, value } = e.target;

        if (formName === "form2") {
            setForm2({ ...form2, [name]: value });
        } else if (formName === "form3") {
            setForm3({ ...form3, [name]: value });
        }
    };

    // Form 2 validation
    const validateForm2 = () => {
        let newErrors = {};

        if (!form2.name) newErrors.name = "Name is required";
        if (!form2.email) {
            newErrors.email = "Email is required";
        } else if (!form2.email.includes("@")) {
            newErrors.email = "Invalid email";
        }

        setErrorsForm2(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Form 3 validation
    const validateForm3 = () => {
        let newErrors = {};

        if (!form3.location) newErrors.location = "Location is required";
        if (!form3.number) {
            newErrors.number = "Number is required";
        } else if (form3.number.length < 10) {
            newErrors.number = "Enter valid number";
        }

        setErrorsForm3(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit handlers
    const handleSubmitForm1 = () => {
        alert("Form 1 submitted ✅");
    };

    const handleSubmitForm2 = () => {
        if (validateForm2()) {
            alert("Form 2 submitted ✅");
        }
    };

    const handleSubmitForm3 = () => {
        if (validateForm3()) {
            alert("Form 3 submitted ✅");
        }
    };

    return (
        <div className="app">
            {/* Animated Background Orbs */}
            <div className="bg-orbs" aria-hidden="true">
                <div className="bg-orb bg-orb--1"></div>
                <div className="bg-orb bg-orb--2"></div>
                <div className="bg-orb bg-orb--3"></div>
            </div>

            <Header status="idle" wsConnected={true} />

            <div className="test-container">
                <h1 className="title">Multi Form Section</h1>

                {/* Get Date Button */}
                <button
                    className="btn"
                    type="button"
                    onClick={() => alert(new Date().toLocaleString())}
                >
                    Get Date
                </button>

                {/* Form 1 */}
                <div className="card">
                    <h2>Form 1</h2>

                    <button
                        className="btn"
                        type="button"
                        onClick={() => setShowExtra(!showExtra)}
                    >
                        {showExtra ? "Hide" : "Show"} Extra Fields
                    </button>

                    {showExtra && (
                        <div className="row">
                            <input className="input" placeholder="Hidden Field 1" />
                            <input className="input" placeholder="Hidden Field 2" />
                        </div>
                    )}

                    <button
                        className="submit-btn"
                        type="button"
                        onClick={handleSubmitForm1}
                    >
                        Submit Form 1
                    </button>
                </div>

                {/* Form 2 */}
                <div className="card">
                    <h2>Form 2</h2>

                    <input
                        className="input"
                        name="name"
                        placeholder="Name"
                        value={form2.name}
                        onChange={(e) => handleChange(e, "form2")}
                    />
                    <p className="error">{errorsForm2.name}</p>

                    <input
                        className="input"
                        name="email"
                        placeholder="Email"
                        value={form2.email}
                        onChange={(e) => handleChange(e, "form2")}
                    />
                    <p className="error">{errorsForm2.email}</p>

                    <button
                        className="submit-btn"
                        type="button"
                        onClick={handleSubmitForm2}
                    >
                        Submit Form 2
                    </button>
                </div>

                {/* Form 3 */}
                <div className="card">
                    <h2>Form 3</h2>

                    <input
                        className="input"
                        name="location"
                        placeholder="Location"
                        value={form3.location}
                        onChange={(e) => handleChange(e, "form3")}
                    />
                    <p className="error">{errorsForm3.location}</p>

                    <input
                        className="input"
                        name="number"
                        placeholder="Phone Number"
                        value={form3.number}
                        onChange={(e) => handleChange(e, "form3")}
                    />
                    <p className="error">{errorsForm3.number}</p>

                    <button
                        className="submit-btn"
                        type="button"
                        onClick={handleSubmitForm3}
                    >
                        Submit Form 3
                    </button>
                </div>

                {/* New Section: Image, Link, Page Button, and Video */}
                <div className="card">
                    <h2>New Features</h2>

                    {/* Image */}
                    <img
                        src="https://via.placeholder.com/150"
                        alt="Placeholder"
                        className="image"
                    />
                    <p>Above is an image tag example.</p>

                    {/* Link */}
                    <a href="https://www.example.com" className="link" target="_blank">
                        Go to Example Website
                    </a>
                    <p>Click the link to visit the website.</p>

                    {/* Page Button */}
                    <button
                        className="btn"
                        type="button"
                        onClick={() => alert("Page Button Clicked!")}
                    >
                        Page Button
                    </button>
                    <p>This is a button that can perform an action.</p>

                    {/* Video Iframe */}
                    <iframe
                        width="560"
                        height="315"
                        src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                    <p>This is an embedded YouTube video.</p>
                </div>
            </div>
        </div>
    );
}

export default Test;