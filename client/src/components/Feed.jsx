import { useEffect, useState } from "react";
import api from "../api/axios"; // Ensure axios is correctly set up

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true); // Added loading state

  useEffect(() => {
    // Fetch posts when the component mounts
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false); // Stop loading if token is not available
          return;
        }

        const response = await api.get("/api/posts", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setPosts(response.data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false); // Stop loading after API call
      }
    };

    fetchPosts();
  }, []);

  if (loading) return <p>Loading posts...</p>;

  return (
    <div>
      <h2>Your Feed</h2>
      {posts.length === 0 ? (
        <p>No posts available</p>
      ) : (
        posts.map((post) => (
          <div key={post._id}>
            <h3>{post.content}</h3>
            <p>By: {post.author.name}</p>
          </div>
        ))
      )}
    </div>
  );
}
