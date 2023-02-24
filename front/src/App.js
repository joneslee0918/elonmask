import React from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from './pages/Home';
import Users from './pages/Users';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route index element={<Home />} />
                <Route path="/users" element={<Users />} />
            </Routes>
        </BrowserRouter>
    )
}
