// models/formModel.js
const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
  title: { type: String, default: 'Untitled Form' },
  display: { type: String, enum: ['form', 'wizard'], default: 'form' },
  components: { type: Array, default: [] },
});

module.exports = mongoose.model('Form', formSchema);
