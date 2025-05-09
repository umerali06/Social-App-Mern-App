import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import api from "../api/axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

export default function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
    socialLinks: {
      twitter: "",
      linkedin: "",
      github: "",
    },
  });
  const [profileFile, setProfileFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [loading, setLoading] = useState(false);

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
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["twitter", "linkedin", "github"].includes(name)) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("bio", form.bio);
      formData.append("location", form.location);
      formData.append("website", form.website);
      formData.append("socialLinks[twitter]", form.socialLinks.twitter);
      formData.append("socialLinks[linkedin]", form.socialLinks.linkedin);
      formData.append("socialLinks[github]", form.socialLinks.github);
      if (profileFile) formData.append("profilePicture", profileFile);
      if (bannerFile) formData.append("bannerImage", bannerFile);

      const res = await api.patch("/users/profile", formData);
      setUser(res.data.user);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 py-10"
    >
      <h1 className="text-3xl font-extrabold mb-8 text-indigo-600 dark:text-indigo-300">
        Edit Your Profile
      </h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Name */}
        <div className="col-span-1">
          <Label>Name</Label>
          <Input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Location */}
        <div className="col-span-1">
          <Label>Location</Label>
          <Input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="City, Country"
          />
        </div>

        {/* Bio */}
        <div className="col-span-2">
          <Label>Bio</Label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows="3"
            className="w-full p-2 border rounded-md bg-white dark:bg-gray-900"
            placeholder="Tell us about yourself..."
          />
        </div>

        {/* Website */}
        <div className="col-span-2">
          <Label>Website</Label>
          <Input
            name="website"
            value={form.website}
            onChange={handleChange}
            placeholder="https://example.com"
          />
        </div>

        {/* Social Links */}
        <div className="col-span-1">
          <Label>Twitter</Label>
          <Input
            name="twitter"
            value={form.socialLinks.twitter}
            onChange={handleChange}
          />
        </div>
        <div className="col-span-1">
          <Label>LinkedIn</Label>
          <Input
            name="linkedin"
            value={form.socialLinks.linkedin}
            onChange={handleChange}
          />
        </div>
        <div className="col-span-2">
          <Label>GitHub</Label>
          <Input
            name="github"
            value={form.socialLinks.github}
            onChange={handleChange}
          />
        </div>

        {/* Profile Picture */}
        <div className="col-span-1">
          <Label>Profile Picture</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, "profile")}
          />
          {profileFile && (
            <img
              src={URL.createObjectURL(profileFile)}
              alt="Profile Preview"
              className="mt-2 rounded w-32 h-32 object-cover border shadow"
            />
          )}
        </div>

        {/* Banner Image */}
        <div className="col-span-1">
          <Label>Banner Image</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, "banner")}
          />
          {bannerFile && (
            <img
              src={URL.createObjectURL(bannerFile)}
              alt="Banner Preview"
              className="mt-2 rounded-lg w-full h-32 object-cover border shadow"
            />
          )}
        </div>

        {/* Save Button */}
        <div className="col-span-2 mt-6">
          <Button
            type="submit"
            className="w-full py-3 text-md font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg shadow-lg"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
