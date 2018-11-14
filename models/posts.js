const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

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







blogSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("Posts", blogSchema);