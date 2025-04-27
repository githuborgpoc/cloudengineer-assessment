import { pool } from "../database.js";
import { redisConection } from "../redis.js";  // Import the Redis client

// Render the add link page
export const renderAddLink = (req, res) => res.render("links/add");

// Add a new link and invalidate the Redis cache
export const addLink = async (req, res) => {
  const { title, url, description } = req.body;
  
  // Insert the new link into the database
  await pool.query("INSERT INTO links set ?", [
    {
      title,
      url,
      description,
      user_id: req.user.id,
    },
  ]);
  
  // Clear the cache after adding a new link
  await redisConection.del(`user_links_${req.user.id}`);

  // Set a flash message
  await req.setFlash("success", "Link Saved Successfully");

  // Redirect the user to the links page
  res.redirect("/links");
};

// Render the list of links, either from cache or the database
export const renderLinks = async (req, res) => {
  const cacheKey = `user_links_${req.user.id}`;

  // Check if the links are in Redis cache
  const cachedLinks = await redisConection.get(cacheKey);

  if (cachedLinks) {
    // If cached, render the links from Redis
    console.log("Returning cached links");
    return res.render("links/list", { links: JSON.parse(cachedLinks) });
  }

  // If not cached, fetch the links from the database
  const [rows] = await pool.query("SELECT * FROM links WHERE user_id = ?", [
    req.user.id,
  ]);

  // Cache the links in Redis for 1 hour (3600 seconds)
  await redisConection.set(cacheKey, JSON.stringify(rows), {
    EX: 3600, // Cache expires in 1 hour
  });

  // Render the links page
  res.render("links/list", { links: rows });
};

// Delete a link and invalidate the Redis cache
export const deleteLink = async (req, res) => {
  const { id } = req.params;

  // Delete the link from the database
  await pool.query("DELETE FROM links WHERE ID = ?", [id]);

  // Clear the cache after deleting the link
  await redisConection.del(`user_links_${req.user.id}`);

  // Set a flash message for successful deletion
  await req.setFlash("success", `Link ${id} Removed Successfully`);

  // Redirect back to the links page
  return res.redirect("/links");
};

// Render the edit link page
export const renderEditLink = async (req, res) => {
  const { id } = req.params;

  // Fetch the link from the database for editing
  const [rows] = await pool.query("SELECT * FROM links WHERE id = ?", [id]);
  res.render("links/edit", { link: rows[0] });
};

// Update a link and invalidate the Redis cache
export const editLink = async (req, res) => {
  const { id } = req.params;
  const { title, description, url } = req.body;

  const newLink = {
    title,
    description,
    url,
  };

  // Update the link in the database
  await pool.query("UPDATE links set ? WHERE id = ?", [newLink, id]);

  // Clear the cache after updating the link
  await redisConection.del(`user_links_${req.user.id}`);

  // Set a flash message for successful update
  await req.setFlash("success", "Link Updated Successfully");

  // Redirect back to the links page
  res.redirect("/links");
};
