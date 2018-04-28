const { Todo } = require('../models/todo');
const { User } = require('../models/user');
const { sendReminderMail } = require('../mailer_service/mailer_service');

let sendReminders = function() {
  let now = new Date();
  let fut = new Date(now.getTime() + (1000 * 60 * 5));
  
  Todo.find({
    reminder: {
      $gt: now,
      $lt: fut
    }
  }).then((todos) => {
    todos.forEach((todo, index, array) => {
      User.findById(todo._creator).then((user) => {
        let title = todo.title;
        let description = todo.description;
        let reciever = user.email;
        
        let diff = new Date(todo.reminder).getTime() - new Date().getTime();
        
        setTimeout(() => {
          sendReminderMail(reciever, title, description);
    
          todo.reminder = null;
          todo.save();
        }, diff);
      });
    });
  });
};

module.exports.sendReminders = sendReminders;