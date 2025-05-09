// src/pages/ProfileView.jsx
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Globe,
  Github,
  Twitter,
  Linkedin,
  ArrowLeft,
  Mail,
  User,
  Edit3,
  Link as LinkIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

export default function ProfileView() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setProfile(user);
      setTimeout(() => setLoading(false), 1000); // simulate loading
    }
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <Skeleton className="h-8 w-8 rounded-full mr-2" />
          <Skeleton className="h-6 w-24" />
        </div>

        <div className="space-y-8">
          {/* Banner Skeleton */}
          <Skeleton className="h-48 w-full rounded-xl" />

          {/* Profile Section */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Side */}
            <div className="md:w-1/3 flex flex-col items-center">
              <Skeleton className="h-32 w-32 rounded-full -mt-16" />
              <Skeleton className="h-6 w-48 mt-4" />
              <Skeleton className="h-4 w-32 mt-2" />
              <Skeleton className="h-4 w-24 mt-2" />
              <Skeleton className="h-10 w-32 mt-6 rounded-full" />
            </div>

            {/* Right Side */}
            <div className="md:w-2/3 space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            </div>
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
      >
        <Button
          onClick={() => {
            if (window.history.length > 2) {
              navigate(-1);
            } else {
              navigate("/"); // fallback to home
            }
          }}
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
          Back
        </Button>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto"
      >
        {/* Banner */}
        <motion.div variants={itemVariants}>
          {profile.bannerImage ? (
            <img
              src={profile.bannerImage}
              alt="Banner"
              className="w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover rounded-xl shadow-lg"
            />
          ) : (
            <div className="w-full h-48 sm:h-56 md:h-64 lg:h-72 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg" />
          )}
        </motion.div>

        <div className="flex flex-col md:flex-row gap-8 mt-8">
          {/* Left Side: Profile Overview */}
          <motion.div
            variants={itemVariants}
            className="md:w-1/3 flex flex-col items-center"
          >
            <div className="relative">
              <Avatar className="w-32 h-32 -mt-16 border-4 border-white dark:border-gray-900 shadow-xl">
                {profile.profilePicture ? (
                  <AvatarImage src={profile.profilePicture} alt="Profile" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-4xl font-bold">
                    {profile.name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute -bottom-2 -right-2"
              >
                <Link to="/profile/edit">
                  <Button
                    size="icon"
                    className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                  >
                    <Edit3 size={16} />
                  </Button>
                </Link>
              </motion.div>
            </div>

            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="text-center mt-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center justify-center gap-2">
                <Mail size={14} /> {profile.email}
              </p>

              {profile.location && (
                <p className="text-sm mt-2 text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                  <MapPin size={14} /> {profile.location}
                </p>
              )}

              <p className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-2">
                <Calendar size={12} /> Joined:{" "}
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6 w-full"
            >
              <Link to="/profile/edit" className="block">
                <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-md">
                  Edit Profile
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Side: Info Boxes */}
          <motion.div variants={itemVariants} className="md:w-2/3 space-y-6">
            {/* Bio & Website */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <User
                      className="text-indigo-600 dark:text-indigo-400"
                      size={20}
                    />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      About Me
                    </h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {profile.bio || (
                      <span className="text-gray-500 italic">
                        No bio added yet. Tell others about yourself!
                      </span>
                    )}
                  </p>

                  {profile.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <LinkIcon
                        className="text-indigo-600 dark:text-indigo-400"
                        size={16}
                      />
                      <a
                        href={
                          profile.website.startsWith("http")
                            ? profile.website
                            : `https://${profile.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                      >
                        {profile.website.replace(/(^\w+:|^)\/\//, "")}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Social Links */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <Globe
                      className="text-indigo-600 dark:text-indigo-400"
                      size={20}
                    />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Social Links
                    </h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <AnimatePresence>
                    {profile.socialLinks?.twitter && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="mb-3 last:mb-0"
                      >
                        <a
                          href={
                            profile.socialLinks.twitter.startsWith("http")
                              ? profile.socialLinks.twitter
                              : `https://twitter.com/${profile.socialLinks.twitter}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="p-2 rounded-full bg-sky-100 dark:bg-sky-900/50">
                            <Twitter size={18} className="text-sky-500" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            Twitter
                          </span>
                        </a>
                      </motion.div>
                    )}

                    {profile.socialLinks?.linkedin && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="mb-3 last:mb-0"
                      >
                        <a
                          href={
                            profile.socialLinks.linkedin.startsWith("http")
                              ? profile.socialLinks.linkedin
                              : `https://linkedin.com/in/${profile.socialLinks.linkedin}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
                            <Linkedin
                              size={18}
                              className="text-blue-700 dark:text-blue-400"
                            />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            LinkedIn
                          </span>
                        </a>
                      </motion.div>
                    )}

                    {profile.socialLinks?.github && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="mb-3 last:mb-0"
                      >
                        <a
                          href={
                            profile.socialLinks.github.startsWith("http")
                              ? profile.socialLinks.github
                              : `https://github.com/${profile.socialLinks.github}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                            <Github
                              size={18}
                              className="text-gray-800 dark:text-gray-200"
                            />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            GitHub
                          </span>
                        </a>
                      </motion.div>
                    )}

                    {!profile.socialLinks?.twitter &&
                      !profile.socialLinks?.linkedin &&
                      !profile.socialLinks?.github && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-sm text-gray-500 italic dark:text-white"
                        >
                          No social links added yet.
                        </motion.p>
                      )}
                  </AnimatePresence>
                </CardContent>
                <CardFooter>
                  <Link to="/profile/edit" className="w-full">
                    <Button
                      variant="outline "
                      className="w-full dark:text-white cursor-pointer"
                    >
                      Add Social Links
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
