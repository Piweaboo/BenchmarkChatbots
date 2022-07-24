const { Schema, model, Collection } = require('mongoose');
//const mongoose_fuzzy_searching = require("@imranbarbhuiya/mongoose-fuzzy-searching");

const VgsalesSchema = Schema({
    Rank: {
        type: Number,
    },
    Name: {
        type: String,
    },
    basename: {
        type: String,
    },
    Genre: {
        type: String,
        default: 'N/A'
    },
    ESRB_Rating: {
        type: String,
        default: 'N/A'
    },
    Platform: {
        type: String,
        default: 'N/A'
    },
    Publisher: {
        type: String,
        default: 'N/A'
    },
    Developer: {
        type: String,
        default: 'N/A'
    },
    Critic_Score: {
        type: String,
        default: 'N/A'
    },
    Total_Shipped: {
        type: String,
        default: 'N/A'
    },
    Global_Sales: {
        type: String,
        default: 'N/A'
    },
    NA_Sales: {
        type: String,
        default: 'N/A'
    },
    PAL_Sales: {
        type: String,
        default: 'N/A'
    },
    JP_Sales: {
        type: String,
        default: 'N/A'
    },
    Other_Sales: {
        type: String,
        default: 'N/A'
    },
    Year: {
        type: Number,
    },
    url: {
        type: String,
    },
    img_url: {
        type: String,
    },
}, { collection: 'VGSales' });

/*
VgsalesSchema.plugin(mongoose_fuzzy_searching, {
    fields: ["Name"],
});
*/

module.exports = model('VGSales', VgsalesSchema);