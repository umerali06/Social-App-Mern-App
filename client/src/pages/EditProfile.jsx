import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { Button } from "@/components/ui/button";
import api from "../api/axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Upload, X } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function EditProfile() {
  const { user, setUser } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({});
  const [profileFile, setProfileFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        socialLinks: {
          twitter: user.socialLinks?.twitter || "",
          linkedin: user.socialLinks?.linkedin || "",
          github: user.socialLinks?.github || "",
        },
      });
      setInitializing(false);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name in form.socialLinks) {
      setForm((f) => ({
        ...f,
        socialLinks: { ...f.socialLinks, [name]: value },
      }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (type === "profile") setProfileFile(file);
    else if (type === "banner") setBannerFile(file);
  };

  const removeFile = (type) => {
    if (type === "profile") setProfileFile(null);
    else if (type === "banner") setBannerFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "socialLinks") {
          Object.entries(value).forEach(([k, v]) => {
            formData.append(`socialLinks[${k}]`, v);
          });
        } else {
          formData.append(key, value);
        }
      });
      if (profileFile) formData.append("profilePicture", profileFile);
      if (bannerFile) formData.append("bannerImage", bannerFile);

      const res = await api.patch("/users/profile", formData);
      setUser(res.data.user);
      toast.success("Profile updated successfully!");
      navigate("/profile");
    } catch (err) {
      toast.error("Failed to update profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <Skeleton className="h-8 w-8 rounded-full mr-2" />
          <Skeleton className="h-6 w-32" />
        </div>

        <div className="space-y-8">
          {/* Profile Section */}
          <div className="flex flex-col items-center">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-10 w-48 mt-4" />
          </div>

          {/* Form Skeleton */}
          <div className="space-y-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-2xl mx-auto"
      >
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
        >
          <motion.div
            whileHover={{ x: -4 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <ArrowLeft
              size={18}
              className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
            />
          </motion.div>
          Back to Profile
        </Button>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto"
      >
        <Card className="overflow-hidden">
          <CardHeader className="pb-0">
            <motion.h1
              variants={itemVariants}
              className="text-2xl font-bold text-center text-gray-900 dark:text-white"
            >
              Edit Your Profile
            </motion.h1>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-6">
              {/* Banner Upload */}
              <motion.div variants={itemVariants}>
                <Label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Banner Image
                </Label>
                <div className="relative group">
                  {bannerFile ? (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(bannerFile)}
                        alt="Banner Preview"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile("banner")}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-full shadow hover:bg-white dark:hover:bg-gray-700 transition-colors"
                      >
                        <X
                          size={16}
                          className="text-gray-800 dark:text-gray-200"
                        />
                      </button>
                    </div>
                  ) : user?.bannerImage ? (
                    <div className="relative">
                      <img
                        src={user.bannerImage}
                        alt="Current Banner"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile("banner")}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-full shadow hover:bg-white dark:hover:bg-gray-700 transition-colors"
                      >
                        <X
                          size={16}
                          className="text-gray-800 dark:text-gray-200"
                        />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-40 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                      <div className="text-center p-4">
                        <Upload size={24} className="mx-auto text-white/80" />
                        <p className="mt-2 text-sm text-white/80">
                          Upload banner image
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    id="bannerUpload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "banner")}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </motion.div>

              {/* Profile Picture Upload */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center"
              >
                <Label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Profile Picture
                </Label>
                <div className="relative group">
                  <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-800 shadow-lg">
                    {profileFile ? (
                      <AvatarImage src={URL.createObjectURL(profileFile)} />
                    ) : user?.profilePicture ? (
                      <AvatarImage src={user.profilePicture} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-4xl font-bold">
                        {user?.name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                    <Upload
                      size={16}
                      className="text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                    />
                  </div>
                  <input
                    id="profileUpload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "profile")}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                {profileFile && (
                  <button
                    type="button"
                    onClick={() => removeFile("profile")}
                    className="mt-2 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center gap-1"
                  >
                    <X size={12} /> Remove
                  </button>
                )}
              </motion.div>

              {/* Name Field */}
              <motion.div variants={itemVariants}>
                <Label
                  htmlFor="name"
                  className="text-gray-700 dark:text-gray-300"
                >
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="mt-1 bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </motion.div>

              {/* Bio Field */}
              <motion.div variants={itemVariants}>
                <Label
                  htmlFor="bio"
                  className="text-gray-700 dark:text-gray-300"
                >
                  Bio
                </Label>
                <textarea
                  id="bio"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows="3"
                  className="mt-1 w-full p-2.5 border rounded-md bg-white dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Tell the world about yourself..."
                />
              </motion.div>

              {/* Location Field */}
              <motion.div variants={itemVariants}>
                <Label
                  htmlFor="location"
                  className="text-gray-700 dark:text-gray-300"
                >
                  Location
                </Label>
                <Input
                  id="location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="mt-1 bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="City, Country"
                />
              </motion.div>

              {/* Website Field */}
              <motion.div variants={itemVariants}>
                <Label
                  htmlFor="website"
                  className="text-gray-700 dark:text-gray-300"
                >
                  Website
                </Label>
                <Input
                  id="website"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  className="mt-1 bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://yourwebsite.com"
                />
              </motion.div>

              {/* Social Links */}
              <motion.div variants={itemVariants}>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  Social Links
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="twitter"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Twitter
                    </Label>
                    <Input
                      id="twitter"
                      name="twitter"
                      value={form.socialLinks?.twitter || ""}
                      onChange={handleChange}
                      className="mt-1 bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="@username"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="linkedin"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin"
                      name="linkedin"
                      value={form.socialLinks?.linkedin || ""}
                      onChange={handleChange}
                      className="mt-1 bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="github"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      GitHub
                    </Label>
                    <Input
                      id="github"
                      name="github"
                      value={form.socialLinks?.github || ""}
                      onChange={handleChange}
                      className="mt-1 bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="github.com/username"
                    />
                  </div>
                </div>
              </motion.div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full"
              >
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
                  disabled={loading}
                >
                  {loading ? "Saving Changes..." : "Save Profile"}
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full"
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </motion.div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  );
}
