/********************************************************************************* 
 * WEB322 – Assignment 05
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 * Name: ______________________ Student ID: ______________ Date: ______________
 *  Published URL: ___________________________________________________________
 *********************************************************************************/
const legoData = require("./modules/legoSets"); // Update the path accordingly
const path = require("path");

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Add the validation function here
function validateFormData(name, year, num_parts, img_url, theme_id, set_num) {
  const errors = [];

  if (!name || !year || !num_parts || !img_url || !theme_id || !set_num) {
    errors.push("All fields are required");
  }

  // Add more validation rules here!!

  return errors;
}

// Middleware for urlencoded form data
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render("home");
});

app.get('/about', (req, res) => {
  res.render("about");
});

app.get("/lego/sets", async (req, res) => {
  let sets = [];

  try {
    if (req.query.theme) {
      sets = await legoData.getSetsByTheme(req.query.theme);
    } else {
      sets = await legoData.getAllSets();
    }

    res.render("sets", { sets });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

app.get("/lego/sets/:num", async (req, res) => {
  try {
    let set = await legoData.getSetByNum(req.params.num);
    res.render("set", { set });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

// GET route to render the "addSet" view with themes
app.get("/lego/addSet", async (req, res) => {
  try {
    const themes = await legoData.getAllThemes();
    res.render("addSet", { themes });
  } catch (err) {
    res.status(500).render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});

// // POST route to handle form submission and add a new set
// app.post("/lego/addSet", async (req, res) => {
//   try {
//     // Extract form data from the request body
//     const { name, year, num_parts, img_url, theme_id, set_num } = req.body;

//     // Validate the form data
//     const validationErrors = validateFormData(name, year, num_parts, img_url, theme_id, set_num);

//     if (validationErrors.length > 0) {
//       // If there are validation errors, render the form with error messages
//       const themes = await legoData.getAllThemes();
//       return res.status(400).render("addSet", { validationErrors, themes });
//     }

//     // Call a function to add the new set to the database
//     await legoData.addSet({ name, year, num_parts, img_url, theme_id, set_num });

//     // Redirect the user after successfully adding the set
//     res.redirect("/lego/sets");
//   } catch (error) {
//     // Handle errors, you might want to render an error page or redirect to the form page with an error message
//     res.status(500).render("error", { message: `I'm sorry, but we have encountered the following error: ${error.errors[0].message}` });
//   }
// });

// POST route to handle form submission and add a new set
app.post("/lego/addSet", async (req, res) => {
  try {
    // Extract form data from the request body
    const { name, year, num_parts, img_url, theme_id, set_num } = req.body;

    // Validate the form data
    const validationErrors = validateFormData(name, year, num_parts, img_url, theme_id, set_num);

    if (validationErrors.length > 0) {
      // If there are validation errors, render the form with error messages
      const themes = await legoData.getAllThemes();
      return res.status(400).render("addSet", { validationErrors, themes });
    }

    // Call a function to add the new set to the database
    await legoData.addSet({ name, year, num_parts, img_url, theme_id, set_num });

    // Redirect the user after successfully adding the set
    res.redirect("/lego/sets");
  } catch (error) {
    // Handle errors, you might want to render an error page or redirect to the form page with an error message
    const errorMessage = error.message || "An unexpected error occurred.";
    res.status(500).render("error", { message: errorMessage });
  }
});


// Route to render the editSet view
app.get('/lego/editSet/:num', async (req, res) => {
  try {
    const setNum = req.params.num;
    const [themeData, setData] = await Promise.all([
      legoData.getAllThemes(), // Assuming this function is available in legoSets module
      legoData.getSetByNum(setNum),
    ]);
    
    res.render('editSet', { themes: themeData, set: setData });
  } catch (err) {
    res.status(404).render('404', { message: err });
  }
});

// Route to handle the form submission for editing a set
app.post('/lego/editSet', async (req, res) => {
  try {
    const { set_num, ...setData } = req.body;
    await legoData.editSet(set_num, setData); // Assuming this function is available in legoSets module
    res.redirect('/lego/sets');
  } catch (err) {
    res.status(500).render('500', { message: `I'm sorry, but we have encountered the following error: ${err.errors[0].message}` });
  }
});
// app.get('/lego/deleteSet/:num', async (req, res) => {
//   try {
//     await legoData.deleteSet(req.params.num);
//     res.redirect('/lego/sets');
//   } catch (err) {
//     res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
//   }
// });
// Add this route to your server.js file
app.get('/lego/deleteSet/:num', async (req, res) => {
  try {
    const setNum = req.params.num;
    await legoData.deleteSet(setNum);
    res.redirect('/lego/sets');
  } catch (err) {
    res.status(500).render('500', { message: `Error deleting set: ${err}` });
  }
});

app.use((req, res, next) => {
  res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
});

legoData.initialize().then(() => {
  app.listen(HTTP_PORT, () => {
    console.log(`server listening on: ${HTTP_PORT}`);
  });
});

app.use((req, res, next) => {
  res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
});
