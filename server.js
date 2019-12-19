const express = require ("express");
const database = require("./tempDatabase");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const knex = require("knex")({
        // client: "pg",
        // connection: {
        //     host: '127.0.0.1',
        //     user: "postgres",
        //     password: "anVvPRpp",
        //     database: 'kulturaljka'
        // }
        client: "pg",
        connection: {
            connectionString: env.process.DATABASE_URL,
            ssl: true
        }
    })




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


const db = knex;
const artists = database.artists;
const users = database.users;

const app = express();

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors());
// NEED TO HASH PASSWORD, LETS TRY ASYNC

// -------------  // ENDPOINTS START // -------------- //
// "/"GET - fetch all artists
app.get("/", (req, res) => {
    res.json(artists);
})
// "/login"POST - receive login data and return response
app.post("/login", (req, res) => {
    const {email, password} = req.body;
    if(email && password){
        db("login").where(
            {
                email: email
            }
        ).select("*")
        //.then(console.log)
        .then(data => {
            if(data.length){
                const passCheck = false;
                bcrypt.compare(password, data[0].hash, function(err, match){
                    if(err){
                        console.log("error checking credentials: ", err);
                        return res.status(400).json({
                            data: err, 
                            message: "error checking credentials"
                        });
                    }
                    if(match){
                        console.log({name: data[0].name, email: data[0].email})
                        res.json({
                            data: {name: data[0].name, email: data[0].email}, 
                            message: "Login success"
                        });
                    }
                    else{
                        console.log("incorrect credentials combination")
                        res.json({
                            data: {},
                            message: "incorrect credentials combination"
                        });
                    }
                })
            }
            else{
                console.log("no such user")
                res.json({
                    data: {},
                    message: "incorrect credentials combination"
                });
            }
        })
        .catch(console.log)
    }
    else{
        res.json({
            data: {},
            message: "Please submit all fields"
        });
    }    
})

// "/register"POST - receive register data and return response
app.post("/register", (req, res) => {
    const {name, email, password} = req.body;

    if(name && email && password){
        // check if same email already exists, bu in the eb

        db("login").where({
            email: email
        }).select("email")
        .then(data => {
            if(!data.length){
                //userExists = false;


                
                // hash the password 
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(password, salt, (err, hash) => {
                    db("login").insert({
                        name: name,
                        email: email,
                        hash: hash
                    })
                    .returning(["name", "email"])
                    .then(data => res.json(
                        {
                            data: {
                                name: data[0].name, 
                                email: data[0].email
                            },
                            message: "registration success"
                        }
                        ))
                    // catch bi isto trebao vratiti do servera
                    .catch(err => console.log("error", err))
                    })
                })
            }
            else{
                // userExists = true;
                res.json(
                    {
                        data: "",
                        message: "email already in use"
                    }
                    )
            }  
        })
        .catch(console.log)
    }
    else{
        res.json({
            data: "", 
            message: "incomplete user data"
        })
    }
})

// "/addartist"POST - receive new artist and return response
app.post("/addartist", (req, res) => {
    const {id, name, image, alt, genre, city, web, submittedBy, submittedOn, lastUpdatedOn, lastUpdatedBy} = req.body;
    console.log("izvan true provjere", req.body);
    if(id && name && image && alt && genre && city && web && submittedBy && submittedOn && lastUpdatedOn && lastUpdatedBy){
        // check if we already have the same band
        // jer prilikom registracije trebam pretraziti ima li vec takav neki...
        console.log("unutar true provjere: ", req.body);

        const sameArtist = artists.find((artist, index) => {
            return artist.name === name
        })
        if(!sameArtist){
            artists.push(req.body);
            res.json(artists);
        }
        else{
            res.json("Izvođač pod tim imenom već postoji. Provjerite radi li se o istom izvođaču ili promijenite ime.")
        }
    }
    else{
        res.json("Incomplete artist data");
    }
})

// "/editartist"PUT - receive edited artist and return response
app.put("/updateartist", (req, res) => {
    const {id, name, image, alt, genre, city, web, submittedBy, submittedOn, lastUpdatedOn, lastUpdatedBy} = req.body;

    if(id && name && image && alt && genre && city && web && submittedBy && submittedOn && lastUpdatedOn && lastUpdatedBy){
        let artistForUpdate = false;
        artists.forEach((artist, index) => {
            if(artist.id === id){
                artistForUpdate = true;
                artists[index] = req.body;
                return
            }
            // ovdje bi trebao ici neki else u slucaju da se ipak ne pronade izvodac za update
        })
        if(artistForUpdate){
            // res.json({data: req.body, message: "Ažuriranje uspješno"});
            res.json(artists);
        }
        else{
            res.json("Greška");
        }
    }
    else{
        res.json({data: {}, message: "Incomplete artist information"});
    }
})



// -------------  // ENDPOINTS END // -------------- //

const PORT = process.env.PORT? process.env.PORT: 5000;
app.listen(PORT, () => {
    console.log(`The server is running on port ${PORT}`);
})