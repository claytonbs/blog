// ADICIONA DEPEND~ENCIAS

const express = require('express');
const nunjucks = require('nunjucks');
const bodyParser = require('body-parser');
const mongoose        = require("mongoose");
const    flash           = require("connect-flash"); 
const    methodOverride  = require("method-override");
const passport = require("passport");

const User = require("./models/user");
const Comment = require("./models/comment");
const LocalStrategy = require("passport-local"); 

const expressSanitizer = require ("express-sanitizer");
const app = express();




   
 // CONFIGURA DEPENDÊNCIAS

app.set('view engine', 'njk');
app.use(express.static(__dirname + "/public"));   
app.use(bodyParser.urlencoded({extended: true}));    
app.use(expressSanitizer());
app.use(methodOverride("_method"));
app.use(flash());



//CONFIGURE AUTH
app.use(require("express-session")({
    secret: "The dog is a lazy animal",
    resave: false,
    saveUninitialized: false
    
}));


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    
    next();
    
});


//CONFIGURE NUNJUCKS
nunjucks.configure('views', {
    autoescape: true,
    express: app
});




// CONFIGURA BANCO DE DADOS     


// mongoose.connect("mongodb://localhost/blog", { useNewUrlParser: true });

mongoose.connect("mongodb://claytonbs:blog123@ds161653.mlab.com:61653/blog", { useNewUrlParser: true });

var blogSchema = new mongoose.Schema({
    title: String,
    content: String,
    imagem: String,
    author: String,
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});


var Posts = mongoose.model("posts", blogSchema);





// INDEX ROUTE

app.get('/', (req,res) =>{
   Posts.find({}, function(err,posts){
           if (err) {
               console.log(err);
           } else {
                res.render("index", {posts: posts, menuActive: "home"});    
           }
       
        }); 
});



// NEW POST ROUTES
app.get('/new', isLoggedIn, (req,res) => {
    
   res.render('newpost', {menuActive: 'new'}); 
    
});



app.post('/new', isLoggedIn, (req,res) => {
    console.log(req.body.title);
    console.log(req.body.author);
    console.log(req.body.content);
    console.log(req.body.image);

    req.body.content = req.sanitize(req.body.content);


    Posts.create({
        title: req.body.title,
        content: req.body.content,
        imagem: req.body.image,
        author: req.user.username
        
        
    }, function(err, post){
        if (err) {
            console.log (err);
        } else {
            console.log(post);
            post.save();
            
        }
        
        
        
    });


     res.redirect("/");
    
});




// SHOW POST ROUTE

app.get("/posts/:id", (req,res) => {
        
    
    Posts.findById(req.params.id).populate("comments").exec((err, post) => {
        if (err){
            console.log(err);   
        } else {
            res.render("show", {post: post});    
        }
    });  
    
});


// EDIT POST ROUTES

app.get('/edit/:id', isLoggedIn, (req,res) => {
   Posts.findById(req.params.id, (err, post) => {
        if (err){
            console.log(err);   
        } else {
            res.render("edit", {post: post});    
        }
    });  
    
});



app.put('/edit/:id', isLoggedIn, (req,res) => {
    console.log(req.body.title);
    console.log(req.body.author);
    console.log(req.body.content);
    console.log(req.body.image);

    req.body.content = req.sanitize(req.body.content);

    Posts.findByIdAndUpdate(req.params.id, {
        title: req.body.title,
        content: req.body.content,
        imagem: req.body.image,
        author: req.user.username
        
        
    }, function(err, post){
        if (err) {
            console.log (err);
        } else {
            console.log(post);
            post.save();
             res.redirect("/");        
        }
        
        
        
    });


    
    
});



// AUTH ROUTES

 app.get('/register', (req,res) =>{
    
    res.render("register",{menuActive: "register"});
     
 });


app.post('/register', (req, res) => {
   
   var newUser = new User({username: req.body.username});
   User.register(newUser, req.body.password, (err, user) =>{
       if(err){
           req.flash("error", err.message + ". Please choose another username.");
           console.log(err);
           return res.redirect("/register");
       } 
           passport.authenticate("local")(req, res, function(){
              req.flash("success", "your account was successfully created");
              res.redirect("/"); 
           });
       
   }); 
});


app.get('/login', (req,res) =>{
    
    res.render("login", {menuActive: "login"});
     
 });



app.post('/login', passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login"
}), (req, res) => {
    
});


app.get('/logout', (req,res) =>{
    req.logout();
    res.redirect("/");
     
 });




// COMMENT ROUTES

app.get('/comment/:id', isLoggedIn, (req,res) => {
   Posts.findById(req.params.id, (err, post) => {
        if (err){
            console.log(err);   
        } else {
            res.render("comment", {post: post});    
        }
    });  
    
});






app.post('/comment/:id', isLoggedIn, (req,res) => {
    console.log(req.body.comment);
    
    Comment.create({
        author: req.body.author,
        text: req.body.text
        
        
    }, function(err, comment){
        if (err) {
            console.log (err);
        } else {
            console.log(comment);
            comment.save();
            Posts.findById(req.params.id, (err, post) => 
                {
                    if (err) {
                        console.log(err); 
                    } else {
                        post.comments.push(comment);
                        post.save();
                        
                    }
                res.redirect("/posts/" + req.params.id);
                
            });
                     
        }
        
        
        
    });


    
    
});


// DELETE ROUTE



app.delete('/delete/:id', isLoggedIn, (req,res) => {
    Posts.findByIdAndRemove(req.params.id, (err)=>{
        if (err){
             req.flash("error", "There was an error. Try again in a few minutes");
             res.redirect("/");
        } else {
            req.flash("success", "There post was successfully deleted");
            res.redirect("/");
        }
    })
    
});




function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "This area is only for registered users. Please login first.");
    res.redirect("/login");
    
}

// TURN ON SERVER

      app.listen(process.env.PORT, process.env.IP, () => {
       console.log("server on....."); 
        
    });
    
    
    
    
    
    //CRIAR ENTRADA FAKE NO BANCO DE DADOS    
    
//  Posts.create({
//   title: "Como criar formiga",
//   content: "Cria de forma bonita",
//   imagem: "https://png.pngtree.com/element_origin_min_pic/17/09/16/4291936c26227dcd0795f20c16913bdc.jpg",
//   author: "Clayton2"
//  }, function (err,pst){
//     if(err){
//         console.log(err);
//     } else {
//          console.log(pst);
//         pst.save();
//     }
//  });
