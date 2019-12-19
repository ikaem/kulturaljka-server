const express = require ("express");
const database = require("./tempDatabase");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const knex = require("knex")({
        client: "pg",
/*         connection: {
            host: '127.0.0.1',
            user: "postgres",
            password: "anVvPRpp",
            database: 'kulturaljka'
        } */
        connection: {
            connectionString: process.env.DATABASE_URL,
            ssl: true
        } 
    })

    //     "nodemon": "^2.0.2"




//     development: {
//         client: "pg",
//         connection: {
//             host: '127.0.0.1',
//             user: "postgres",
//             password: "anVvPRpp",
//             database: 'kulturaljka'
//         }
//     },
//     production: {
//         client: "pg",
//         connection: process.env.DATABASE_URL,
// /*        migrations: {
//             directory: __dirname + "/db/migrations",
//         },
//          seeds: {
//             directory: __dirname + "/db/seeds/production",
//         } */
//     }

// });


/* const artists = database.artists;
const users = database.users; */

const app = express();
const db = knex;


app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors());
// NEED TO HASH PASSWORD, LETS TRY ASYNC

// -------------  // ENDPOINTS START // -------------- //
// "/"GET - fetch all artists
app.get("/", (req, res) => {
    db("artists")
    .select("*")
    .returning("*")
    .then(data => {
        res.json(data);
    })
    .catch(console.log);

    // 
    // res.json("It works");
})
// "/login"POST - receive login data and return response
app.post("/login", (req, res) => {
    const {email, password} = req.body;
    if(email && password){
        db("login").where({email: email})
        .select("*")
        .then(data => {
            if(data.length){
                bcrypt.compare(password, data[0].hash, function(err, match){
                    if(err){
                        console.log("errror checking credentials: ", err);
                        return res.status(400).json({data: err, message: "error checking credentials"});
                    }
                    if(match){
                        res.json({data: {name: data[0].name, email: data[0].email}, message: "Login success"});
                    }
                    else{
                        console.log("incorrect credentials combination")
                        res.json({data: {}, message: "incorrect credentials combination"});
                    }
                })
            }
            else{
                console.log("no such user")
                res.json({data: {}, message: "incorrect credentials combination"});
            }
        })
        .catch(console.log)
    }
    else{
        res.json({data: {}, message: "Please submit all fields"});
    }    
})
// "/register"POST - receive register data and return response
app.post("/register", (req, res) => {
    const {name, email, password} = req.body;
    if(name && email && password){
        console.log(req.body);
        db("login").where({email: email})
        .select("email")
        .then(data => {
            if(!data.length){
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(password, salt, (err, hash) => {
                        db("login").insert({name: name,email: email, hash: hash})
                    .returning(["name", "email"])
                    .then(data => res.json(
                        {data: {name: data[0].name,email: data[0].email},message: "registration success"}))
                    .catch(err => console.log("error", err))
                    })
                })
            }
            else{res.json({data: "",message: "email already in use"})}  
        })
        .catch(err => console.log(err));
    }
    else{res.json({data: "", message: "incomplete user data"})
    }
})

// "/addartist"POST - receive new artist and return response
app.post("/addartist", (req, res) => {
const {name, image, alt, genre, city, web, submittedby, submittedon, lastupdatedon, lastupdatedby} = req.body;
    if(name, image, alt, genre, city, web, submittedby, submittedon, lastupdatedon, lastupdatedby){
        db("artists")
        .where({name: name})
        .returning("name")
        .then(data => {
            // ako je prazan array
            if(!data.length){
                db.insert(
                    {
                        name: name,
                        image: image,
                        alt: alt,
                        genre: genre,
                        city: city,
                        web: web,
                        submittedby: submittedby,
                        submittedon: submittedon,
                        lastupdatedon: lastupdatedon,
                        lastupdatedby: lastupdatedby,
                    }
                )
                .into("artists")
                .then(() => {
                    db("artists").select("*")
                    .then(data => res.json({
                        data: data,
                        message: "new artist successfully added"
                    }))
                    .catch(err => res.json({
                        data: err,
                        message: "adding new artist failed"
                    }))
                })
            }
            else{
                res.json({
                    data: "",
                    message: "an artist with this name already exists"
                });
            }
        })
    }
    else {
        res.status(500).json({
            data: "",
            message: "Please fill all fields"
        })
    }


})

// "/editartist"PUT - receive edited artist and return response
app.put("/updateartist", (req, res) => {
    // treba provdjeriti je li sve ispunjeno
    console.log(req.body);
    const {id, name, image, alt, genre, city, web, submittedby, submittedon, lastupdatedon, lastupdatedby} = req.body;
    if(id, name, image, alt, genre, city, web, submittedby, submittedon, lastupdatedon, lastupdatedby){

        db("artists")
        .where({id: id})
        .update(
            {                        
                name: name,
                image: image,
                alt: alt,
                genre: genre,
                city: city,
                web: web,
                lastupdatedon: lastupdatedon,
                lastupdatedby: lastupdatedby,
            }
        )
        .returning("*")
        .then(artist => {

            db("artists").select("*")
            .then(artists => res.json({
                data: {currentArtist: artist[0], artists: artists},
                message: "the artist was successfully updated"
            }))
            .catch(err => res.json({
                data: err,
                message: "data retrieval failed"
            }))

        })
        .catch(err => {
            res.json(
                {
                    data: err,
                    message: "there was an error with updating"
                }
            )
        })
    }
    else{
        res.json(
            {
                data: "",
                message: "no such artist was found"
            }
        )
    }
})



// -------------  // ENDPOINTS END // -------------- //

const PORT = process.env.PORT? process.env.PORT: 5000;
app.listen(PORT, () => {
    console.log(`The server is running on port ${PORT}`);
})