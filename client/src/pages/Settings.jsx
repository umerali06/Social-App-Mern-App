/* eslint-disable no-undef */
import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiSettings,
  FiUser,
  FiLock,
  FiMail,
  FiBell,
  FiMoon,
  FiSun,
  FiTrash2,
  FiLogOut,
  FiChevronDown,
  FiArrowLeft,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import i18n from "../i18n";
import { useTranslation } from "react-i18next";
import api from "../api/axios";

const Settings = () => {
  const { user, logout, updateUser, updateLanguage } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );
  const [activeSection, setActiveSection] = useState("account");
  const [formData, setFormData] = useState({
    name: user?.name || "",
    username: user?.username || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    push: true,
    mentions: true,
    messages: true,
    marketing: true,
  });
  const [fontSize, setFontSize] = useState(
    localStorage.getItem("fontSize") || "medium"
  );
  const [activeSessions, setActiveSessions] = useState([]);
  const [forceUpdate, setForceUpdate] = useState(false);
  const { t } = useTranslation();

  // Apply font size when component mounts or fontSize changes
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-font-size", fontSize);
    localStorage.setItem("fontSize", fontSize);

    // Apply font size class
    html.classList.remove("font-small", "font-medium", "font-large");
    html.classList.add(`font-${fontSize}`);
  }, [fontSize]);

  // Initialize notification preferences from user data
  useEffect(() => {
    if (user?.notificationPreferences) {
      setNotificationPrefs(user.notificationPreferences);
    }
  }, [user]);

  // Load active sessions on mount
  useEffect(() => {
    const loadActiveSessions = async () => {
      try {
        const response = await api.get("/users/active-sessions");
        setActiveSessions(response.data.sessions);
      } catch (error) {
        console.error("Failed to load active sessions:", error);
      }
    };

    loadActiveSessions();
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());
    document.documentElement.classList.toggle("dark", newMode);
  };

  const changeFontSize = (size) => {
    setFontSize(size);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const handleNotificationChange = (type) => {
    const newPrefs = {
      ...notificationPrefs,
      [type]: !notificationPrefs[type],
    };
    setNotificationPrefs(newPrefs);

    // Save immediately when toggled
    handleSaveNotifications(newPrefs);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = t("settings.errors.nameRequired");
    if (!formData.email) {
      newErrors.email = t("settings.errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("settings.errors.emailInvalid");
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      newErrors.newPassword = t("settings.errors.passwordLength");
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t("settings.errors.passwordMismatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Update user data in context
      await updateUser({
        name: formData.name,
        email: formData.email,
        username: formData.username,
      });

      alert(t("settings.accountUpdated"));
    } catch (error) {
      alert(t("settings.updateError") + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (!formData.currentPassword) {
      setErrors({
        ...errors,
        currentPassword: t("settings.errors.currentPasswordRequired"),
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/users/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      alert(t("settings.passwordChanged"));
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      alert(errorMsg || t("settings.passwordChangeError"));

      if (errorMsg?.includes("Current password is incorrect")) {
        setErrors({
          ...errors,
          currentPassword: t("settings.errors.incorrectPassword"),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSessionLogout = async (sessionId) => {
    try {
      await api.post("/users/logout-session", { sessionId });
      setActiveSessions(
        activeSessions.filter((session) => session.id !== sessionId)
      );
      alert(t("settings.sessionLoggedOut"));
    } catch (error) {
      alert(t("settings.sessionLogoutError") + error.message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsSubmitting(true);
      await api.delete("/users/delete-account");

      logout();
      navigate("/signup");
      alert(t("settings.accountDeleted"));
    } catch (error) {
      alert(t("settings.deleteError") + error.message);
    } finally {
      setIsSubmitting(false);
      setShowDeleteModal(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.get("/auth/logout");
      logout();
      navigate("/signin");
    } catch (error) {
      alert(t("settings.logoutError") + error.message);
    }
  };

  const handleLanguageChange = async (language) => {
    try {
      await updateLanguage(language);
      await i18n.changeLanguage(language);
      localStorage.setItem("i18nextLng", language);
      setForceUpdate((prev) => !prev); // Force re-render
    } catch (error) {
      alert(t("settings.languageChangeError") + error.message);
    }
  };

  const handleSaveNotifications = async (preferences = notificationPrefs) => {
    try {
      await api.patch("/users/notification-preferences", { preferences });
      // No alert here to avoid spamming when toggling switches
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
    }
  };

  const sections = [
    {
      id: "account",
      icon: <FiUser className="inline mr-2" />,
      label: t("settings.account"),
    },
    {
      id: "security",
      icon: <FiLock className="inline mr-2" />,
      label: t("settings.security"),
    },
    {
      id: "notifications",
      icon: <FiBell className="inline mr-2" />,
      label: t("settings.notifications"),
    },
    {
      id: "appearance",
      icon: darkMode ? (
        <FiMoon className="inline mr-2" />
      ) : (
        <FiSun className="inline mr-2" />
      ),
      label: t("settings.appearance"),
    },
  ];

  const handleBack = () => {
    navigate(location.state?.from || "/");
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-8"
            >
              <div className="flex items-center mb-4">
                <button
                  onClick={handleBack}
                  className="mr-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <FiArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold flex items-center">
                  <FiSettings className="mr-2" /> {t("settings.title")}
                </h1>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {t("settings.subtitle")}
              </p>
            </motion.div>

            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                    activeSection === section.id
                      ? "bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-400"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {section.icon}
                  {section.label}
                </button>
              ))}
            </nav>

            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-lg flex items-center text-red-500 hover:bg-red-50 dark:hover:bg-gray-800"
              >
                <FiLogOut className="mr-2" /> {t("settings.logout")}
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <motion.div
              key={`${activeSection}-${forceUpdate}`} // Force re-render on language change
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              {/* Account Settings */}
              {activeSection === "account" && (
                <div>
                  <h2 className="text-xl font-bold mb-6 flex items-center">
                    <FiUser className="mr-2" /> {t("settings.accountInfo")}
                  </h2>

                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          htmlFor="name"
                        >
                          {t("settings.fullName")}
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 rounded-lg border ${
                            errors.name
                              ? "border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          } bg-gray-50 dark:bg-gray-700`}
                        />
                        {errors.name && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          htmlFor="username"
                        >
                          {t("settings.username")}
                        </label>
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          htmlFor="email"
                        >
                          {t("settings.email")}
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 rounded-lg border ${
                            errors.email
                              ? "border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          } bg-gray-50 dark:bg-gray-700`}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
                        >
                          {isSubmitting ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              {t("settings.saving")}
                            </>
                          ) : (
                            t("settings.saveChanges")
                          )}
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="mt-12">
                    <h3 className="text-lg font-medium mb-4 text-red-500 flex items-center">
                      <FiTrash2 className="mr-2" /> {t("settings.dangerZone")}
                    </h3>
                    <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                      <p className="mb-3">{t("settings.deleteWarning")}</p>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        {t("settings.deleteAccount")}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeSection === "security" && (
                <div>
                  <h2 className="text-xl font-bold mb-6 flex items-center">
                    <FiLock className="mr-2" /> {t("settings.security")}
                  </h2>

                  <form onSubmit={handlePasswordChange}>
                    <div className="space-y-4">
                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          htmlFor="currentPassword"
                        >
                          {t("settings.currentPassword")}
                        </label>
                        <input
                          type="password"
                          id="currentPassword"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 rounded-lg border ${
                            errors.currentPassword
                              ? "border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          } bg-gray-50 dark:bg-gray-700`}
                        />
                        {errors.currentPassword && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.currentPassword}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          htmlFor="newPassword"
                        >
                          {t("settings.newPassword")}
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 rounded-lg border ${
                            errors.newPassword
                              ? "border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          } bg-gray-50 dark:bg-gray-700`}
                        />
                        {errors.newPassword && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.newPassword}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          htmlFor="confirmPassword"
                        >
                          {t("settings.confirmPassword")}
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 rounded-lg border ${
                            errors.confirmPassword
                              ? "border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          } bg-gray-50 dark:bg-gray-700`}
                        />
                        {errors.confirmPassword && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.confirmPassword}
                          </p>
                        )}
                      </div>

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
                        >
                          {isSubmitting ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              {t("settings.updating")}
                            </>
                          ) : (
                            t("settings.changePassword")
                          )}
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="mt-12">
                    <h3 className="text-lg font-medium mb-4">
                      {t("settings.activeSessions")}
                    </h3>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      {activeSessions.map((session) => (
                        <div
                          key={session.id}
                          className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700 last:border-b-0"
                        >
                          <div>
                            <p className="font-medium">{session.device}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t("settings.lastActive")}: {session.lastActive}
                            </p>
                          </div>
                          <button
                            onClick={() => handleSessionLogout(session.id)}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm"
                          >
                            {t("settings.logout")}
                          </button>
                        </div>
                      ))}

                      {activeSessions.length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                          {t("settings.noActiveSessions")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeSection === "notifications" && (
                <div>
                  <h2 className="text-xl font-bold mb-6 flex items-center">
                    <FiBell className="mr-2" />{" "}
                    {t("settings.notificationPreferences")}
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-3">
                        {t("settings.emailNotifications")}
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {t("settings.accountActivity")}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t("settings.accountActivityDesc")}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPrefs.email}
                              onChange={() => handleNotificationChange("email")}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {t("settings.marketingEmails")}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t("settings.marketingEmailsDesc")}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPrefs.marketing}
                              onChange={() =>
                                handleNotificationChange("marketing")
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">
                        {t("settings.pushNotifications")}
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {t("settings.newMessages")}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t("settings.newMessagesDesc")}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPrefs.messages}
                              onChange={() =>
                                handleNotificationChange("messages")
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {t("settings.mentions")}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t("settings.mentionsDesc")}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPrefs.mentions}
                              onChange={() =>
                                handleNotificationChange("mentions")
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {activeSection === "appearance" && (
                <div>
                  <h2 className="text-xl font-bold mb-6 flex items-center">
                    {darkMode ? (
                      <FiMoon className="mr-2" />
                    ) : (
                      <FiSun className="mr-2" />
                    )}
                    {t("settings.appearance")}
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-3">
                        {t("settings.theme")}
                      </h3>
                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            if (darkMode) toggleDarkMode();
                          }}
                          className={`flex-1 p-4 rounded-lg border ${
                            !darkMode
                              ? "border-blue-500 bg-blue-50 dark:bg-gray-700"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          <div className="flex items-center justify-center mb-2">
                            <FiSun size={24} />
                          </div>
                          <p className="font-medium">{t("settings.light")}</p>
                        </button>

                        <button
                          onClick={() => {
                            if (!darkMode) toggleDarkMode();
                          }}
                          className={`flex-1 p-4 rounded-lg border ${
                            darkMode
                              ? "border-blue-500 bg-blue-50 dark:bg-gray-700"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          <div className="flex items-center justify-center mb-2">
                            <FiMoon size={24} />
                          </div>
                          <p className="font-medium">{t("settings.dark")}</p>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">
                        {t("settings.fontSize")}
                      </h3>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => changeFontSize("small")}
                          className={`px-4 py-2 border rounded-lg ${
                            fontSize === "small"
                              ? "border-blue-500 bg-blue-50 dark:bg-gray-700"
                              : "border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {t("settings.small")}
                        </button>
                        <button
                          onClick={() => changeFontSize("medium")}
                          className={`px-4 py-2 border rounded-lg ${
                            fontSize === "medium"
                              ? "border-blue-500 bg-blue-50 dark:bg-gray-700"
                              : "border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {t("settings.medium")}
                        </button>
                        <button
                          onClick={() => changeFontSize("large")}
                          className={`px-4 py-2 border rounded-lg ${
                            fontSize === "large"
                              ? "border-blue-500 bg-blue-50 dark:bg-gray-700"
                              : "border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {t("settings.large")}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">
                        {t("settings.language")}
                      </h3>
                      <div className="relative">
                        <select
                          value={i18n.language}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                          className="appearance-none w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 pr-8"
                        >
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                        </select>
                        <div className="absolute right-3 top-3 pointer-events-none">
                          <FiChevronDown />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4 text-red-500 flex items-center">
              <FiTrash2 className="mr-2" /> {t("settings.deleteAccount")}
            </h3>
            <p className="mb-6">{t("settings.deleteConfirmation")}</p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t("settings.cancel")}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {isSubmitting
                  ? t("settings.deleting")
                  : t("settings.deleteAccount")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Settings;
