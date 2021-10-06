const express = require('express');
const app = express();
const port = 3000;

const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const bcrypt = require('bcryptjs');

const {v4:uuidv4} = require('uuid');

const Ajv = require('ajv');
const ajv = new Ajv();
const postingSchema = require('./schemas/posting_schema.json');
const postingPatchSchema = require('./schemas/posting_patch_schema.json');
const userSchema = require('./schemas/user_schema.json');

app.use(express.json());
/*app.use(express.urlencoded({ 
    extended: true 
}));*/

let userDb = [];
let postingDb = [];

passport.use(new BasicStrategy(
    (username, password, done) => {
        const searchResult = userDb.find(user => {
            if(user.username === username) {
                if(bcrypt.compareSync(password, user.password)) {
                    return true;
                }
            }
            return false;
        });

        if (searchResult != undefined) 
        {
            done(null, searchResult);
        } else {
            done(null, false);
        }
    }
));

////////////////////////////////

app.post('/posting', passport.authenticate('basic', { session: false }), (req, res) => {

    const valid = ajv.validate(postingSchema, req.body);

    if (!valid) {
        return res.status(400).send(ajv.errors);
    }

    const posting = { 
        id: uuidv4(),
        userId: req.user.id,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        location: req.body.location,
        images: req.body.images,
        price: req.body.price,
        date_of_posting: Date.now(),
        delivery: req.body.delivery,
        contact: 
        {
            name: req.body.contact.name, 
            phone: req.body.contact.phone 
        }
    }

    addPosting(posting);
    res.sendStatus(201);
})

app.get('/postings', (req, res) => {
    let postings = postingDb;

    if (req.query.category) {
        postings = postings.filter((p) => p.category === req.query.category);
    }

    if (req.query.location) {
        postings = postings.filter((p) => p.location === req.query.location);
    }

    if (req.query.date) {
        postings.sort(function (a, b) {
            return (a.date_of_posting - b.date_of_posting) * (req.query.date < 1 ? -1 : 1);
        });
    }

    res.send(postings);
})

app.patch('/posting/:id', passport.authenticate('basic', { session: false }), (req, res) => {
    
    if (postingDb.some(d => d.id === req.params.id)) {
        var posting = postingDb.find(d => d.id === req.params.id);
    } else {
        return res.sendStatus(404);
    }
        
    if (posting.userId !== req.user.id) {
        return res.sendStatus(403);
    }
    
    const valid = ajv.validate(postingPatchSchema, req.body);

    if (!valid) {
        return res.status(400).send(ajv.errors);
    }
    
    posting = {...posting, ...req.body};
    
    deletePosting(posting);
    addPosting(posting);

    res.status(200).send(posting);
})

app.delete('/posting/:id', passport.authenticate('basic', { session: false }), (req, res) => {
    
    if (postingDb.some(d => d.id === req.params.id)) {
        var posting = postingDb.find(d => d.id === req.params.id);
    } else {
        return res.sendStatus(404);
    }
    
    if (posting.userId !== req.user.id) {
        return res.sendStatus(403);
    }

    deletePosting(posting);

    res.status(200).send("Posting deleted");
})

////////////////////////////////

app.post('/signup', (req, res) => {

    const valid = ajv.validate(userSchema, req.body);

    if (!valid) {
        //res.status(400).send(ajv.errors);
        res.sendStatus(400);
        return;
    }

    const salt = bcrypt.genSaltSync(6);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt)

    const user = {
        id: uuidv4(),
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword
    }

    addUser(user);
    res.sendStatus(201);
});

app.post('/login', passport.authenticate('basic', { session: false }), (req, res) => {
    res.status(200).send("User has logged in!");
})

////////////////////////////////

function addPosting(posting) {
    postingDb.push(posting);
}

function deletePosting(posting) {
    postingDb = postingDb.filter(({id}) => id !== posting.id);
}

function addUser(user) {
    userDb.push(user);
}


/*app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})*/


let serverInstance = null;

module.exports = {
    start: function() {
        serverInstance = app.listen(port, () => {
            console.log(`Example app listening at http://localhost:${port}`)
        })
    },
    close: function() {
        serverInstance.close();
    }
}