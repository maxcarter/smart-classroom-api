const log = require('winston');
var ctrls = require('../controllers');
var models = require('../models');

module.exports = {
    /**
     * Validates schema before creating a classroom
     * @param  {object}   req  Request object
     * @param  {object}   res  Response object
     * @param  {Function} next Callback function to move on to the next middleware
     */
    validateCreate: (req, res, next) => {
        log.info('Module - ValidateCreate Classroom');

        // Validate schema
        log.info('Validating classroom model...')
        var classroom = new models.classrooms(req.body);
        var error = classroom.validateSync();

        if (error) {
            log.error('classroom model validation failed!');
            let err = new Error('Classroom Validation Failed!');
            err.status = 400;
            // Remove stack trace but retain detailed description of validation errors
            err.data = JSON.parse(JSON.stringify(error));
            next(err);
            return;
        }

        log.info('Classroom model has been validated!');
        next();
    },
    /**
     * Creates a classroom
     * @param  {object}   req  Request object
     * @param  {object}   res  Response object
     * @param  {Function} next Callback function to move on to the next middleware
     * @return {object}        Populates res.locals with newly created classroom document
     */
    create: (req, res, next) => {
        log.info('Module - Create Classroom');
        var classroom = new models.classrooms(req.body);
        ctrls.mongodb.save(classroom, (err, classroomData) => {
            if (err) {
                let err = new Error('Failed creating classroom!');
                err.status = 500;
                next(err);
                return;
            }
            ctrls.mongodb.findById(models.teachers, classroomData.teacher, (err, teacherData) => {
                //TODO: figure out how to properly handle error
                if (err) {
                    log.error('Failled adding classroom to teacher [' + classroomData.teacher + ']');
                    return;
                }
                log.info('Successfully found teacher [' + classroomData.teacher + ']');

                log.info('Adding classroom to teacher');
                teacherData.classrooms.push(classroomData._id);

                ctrls.mongodb.save(teacherData, (err, _result) => {
                    //TODO: figure out how to properly handle error
                    if (err) {
                        log.error('Failled adding classroom to teacher [' + classroomData.teacher + ']');
                        return;
                    }
                    log.info('Successfully added teacher to classroom');
                });
            });

            for (let i = 0; i < classroomData.students.length; i++) {
                ctrls.mongodb.findById(models.students, classroomData.students[i], (err, studentData) => {
                    //TODO: figure out how to properly handle error
                    if (err) {
                        log.error('Failled adding classroom to student [' + classroomData.students[i] + ']');
                        return;
                    }
                    log.info('Successfully found student [' + classroomData.students[i] + ']');

                    log.info('Adding classroom to student');
                    studentData.classrooms.push(classroomData._id);

                    ctrls.mongodb.save(studentData, (err, _result) => {
                        //TODO: figure out how to properly handle error
                        if (err) {
                            log.error('Failled adding classroom to student [' + classroomData.students[i] + ']');
                            return;
                        }

                        log.info('Successfully added student [' + classroomData.students[i] + '] to classroom');
                    });
                });
            }

            log.info('Successfully created classroom');
            res.locals = classroomData;
            next();
        });
    },
    /**
     * Gets all classrooms
     * @param  {object}   req  Request object
     * @param  {object}   res  Response object
     * @param  {Function} next Callback function to move on to the next middleware
     * @return {object}        Populates res.locals with array of all classrooms documents
     */
    getAll: (req, res, next) => {
        log.info('Module - GetAll Classrooms');
        ctrls.mongodb.find(models.classrooms, {}, (err, results) => {
            if (err) {
                let err = new Error('Failed getting all classrooms!');
                err.status = 500;
                next(err);
                return;
            }
            log.info('Successfully found all classrooms.');
            res.locals = results;
            next();
        });
    },
    /**
     * Validates path id parameter
     * @param  {object}   req  Request object
     * @param  {object}   res  Response object
     * @param  {Function} next Callback function to move on to the next middleware
     */
    validatePathId: (req, res, next) => {
        log.info('Module - validatePathId Classrooms');

        log.info('Validating request...');
        if (!req.params.id) {
            log.error('Request validation failed');
            let err = new Error('Missing required id parameter in the request path. (/classrooms/:id)');
            err.status = 400;
            next(err);
            return;
        }

        if (!ctrls.mongodb.isObjectId(req.params.id)) {
            log.error('Request validation failed');
            let err = new Error('Invalid id parameter in the request path.');
            err.status = 400;
            next(err);
            return;
        }

        log.info('Request validated!');
        next();
    },
    /**
     * Gets a classroom
     * @param  {object}   req  Request object
     * @param  {object}   res  Response object
     * @param  {Function} next Callback function to move on to the next middleware
     * @return {object}        Populates res.locals with classroom document
     */
    getOne: (req, res, next) => {
        log.info('Module - GetOne Classroom');
        ctrls.mongodb.findById(models.classrooms, req.params.id, (err, result) => {
            if (err) {
                let err = new Error('Failed getting classroom: ' + req.params.id);
                err.status = 500;
                next(err);
                return;
            }
            log.info('Successfully found classroom [' + req.params.id + ']');
            res.locals = result;
            next();
        });
    },
    /**
     * Deletes a classroom
     * @param  {object}   req  Request object
     * @param  {object}   res  Response object
     * @param  {Function} next Callback function to move on to the next middleware
     * @return {object}        Populates res.locals with deletion result
     */
    deleteOne: (req, res, next) => {
        log.info('Module - DeleteOne Classrooms');
        ctrls.mongodb.findByIdAndRemove(models.classrooms, req.params.id, (err, result) => {
            if (err) {
                let err = new Error('Failed deleting classroom: ' + req.params.id);
                err.status = 500;
                next(err);
                return;
            }
            log.info('Successfully deleted classroom [' + req.params.id + ']');
            res.locals = result;
            next();
        });
    },

    /**
     * Validates path quizId parameter
     * @param  {object}   req  Request object
     * @param  {object}   res  Response object
     * @param  {Function} next Callback function to move on to the next middleware
     */
    validateQuizId: (req, res, next) => {
        log.info('Module - validateQuizId Classrooms');

        log.info('Validating request...');
        if (!req.params.quizId) {
            log.error('Request validation failed');
            let err = new Error('Missing required quiz id parameter in the request path.');
            err.status = 400;
            next(err);
            return;
        }

        if (!ctrls.mongodb.isObjectId(req.params.quizId)) {
            log.error('Request validation failed');
            let err = new Error('Invalid quiz id parameter in the request path.');
            err.status = 400;
            next(err);
            return;
        }

        log.info('Quiz Id Request validated!');
        next();
    },

    /**
     * Validates schema before creating a quiz
     * @param  {object}   req  Request object
     * @param  {object}   res  Response object
     * @param  {Function} next Callback function to move on to the next middleware
     */
    validateQuizCreation: (req, res, next) => {
        log.info('Module - validateQuizCreation Classrooms');

        // Validate schema
        log.info('Validating quiz model...')
        var quiz = new models.quizzes(req.body);
        var error = quiz.validateSync();

        if (error) {
            log.error('Quiz model validation failed!');
            let err = new Error('Quiz Validation Failed!');
            err.status = 400;
            // Remove stack trace but retain detailed description of validation errors
            err.data = JSON.parse(JSON.stringify(error));
            next(err);
            return;
        }

        log.info('Quiz model has been validated!');
        next();
    },

    /**
     * Creates a Quiz
     * @param  {object}   req  Request object
     * @param  {object}   res  Response object
     * @param  {Function} next Callback function to move on to the next middleware
     */
    createQuiz: (req, res, next) => {
        log.info('Module - createQuiz Classrooms');

        var quiz = new models.quizzes(req.body);
        ctrls.mongodb.findById(models.classrooms, req.params.id, (err, classroom) => {
            if (err) {
                let err = new Error('Failed getting classroom: ' + req.params.id);
                err.status = 500;
                next(err);
                return;
            }
            log.info('Successfully found classroom [' + req.params.id + ']');

            log.info('Creating Quiz for classroom [' + req.params.id + ']');
            ctrls.mongodb.save(quiz, (err, result) => {
                if (err) {
                    let err = new Error('Error creating quiz for classroom [' + req.params.id + ']');
                    err.status = 500;
                    next(err);
                    return;
                }

                log.info('Successfully created quiz');
                res.locals = result;

                log.info('Adding quiz [' + result._id + '] to classroom [' + classroom._id + ']');
                classroom.quizHistory.push(result._id);

                ctrls.mongodb.save(classroom, (err, _result) => {
                    if (err) {
                        let err = new Error('Failed adding quiz [' + result._id + '] to classroom [' + classroom._id + ']');
                        err.status = 500;
                        next(err);
                        return;
                    }

                    log.info('Succesfully added quiz [' + result._id + '] to classroom [' + classroom._id + ']');
                    next();
                });
            });
        });
    },
    /**
     * Gets all classroom quizzes
     * @param  {object}   req  Request object
     * @param  {object}   res  Response object
     * @param  {Function} next Callback function to move on to the next middleware
     */
    getAllQuizzes: (req, res, next) => {
        log.info('Module - getAllQuizzes Classrooms');
        let populators = [{
            path: 'quizHistory'
        }];
        ctrls.mongodb.findByIdAndPopulate(models.classrooms, req.params.id, populators, (err, classroom) => {
            if (err) {
                let err = new Error('Failed getting classroom: ' + req.params.id);
                err.status = 500;
                next(err);
                return;
            }
            log.info('Successfully found classroom [' + req.params.id + ']');
            res.locals = classroom.quizHistory;
            next();
        });
    },
    /**
     * Gets all active classroom quizzes
     * @param  {object}   req  Request object
     * @param  {object}   res  Response object
     * @param  {Function} next Callback function to move on to the next middleware
     */
    getAllActiveQuizzes: (req, res, next) => {
        log.info('Module - getAllQuizzes Classrooms');
        let populators = [{
            path: 'quizHistory'
        }];
        ctrls.mongodb.findByIdAndPopulate(models.classrooms, req.params.id, populators, (err, classroom) => {
            if (err) {
                let err = new Error('Failed getting classroom: ' + req.params.id);
                err.status = 500;
                next(err);
                return;
            }
            log.info('Successfully found classroom [' + req.params.id + ']');
            log.info('Filtering out non activated quizzes');
            let quizzes = [];
            for (let i = 0; i < classroom.quizHistory.length; i++) {
                if (classroom.quizHistory[i].activated) {
                    quizzes.push(classroom.quizHistory[i]);
                }
            }
            res.locals = quizzes;
            next();
        });
    },
    /**
     * Validates path attendanceId parameter
     * @param  {object}   req  Request object
     * @param  {object}   res  Response object
     * @param  {Function} next Callback function to move on to the next middleware
     */
    validateAttendanceId: (req, res, next) => {
        log.info('Module - validateAttendanceId Classrooms');

        log.info('Validating request...');
        if (!req.params.attendanceId) {
            log.error('Request validation failed');
            let err = new Error('Missing required attendance id parameter in the request path.');
            err.status = 400;
            next(err);
            return;
        }

        if (!ctrls.mongodb.isObjectId(req.params.attendanceId)) {
            log.error('Request validation failed');
            let err = new Error('Invalid attendance id parameter in the request path.');
            err.status = 400;
            next(err);
            return;
        }

        log.info('Attendance Id Request validated!');
        next();
    },

    /**
     * Validates schema before creating an attendance
     * @param  {object}   req  Request object
     * @param  {object}   res  Response object
     * @param  {Function} next Callback function to move on to the next middleware
     */
    validateAttendanceCreation: (req, res, next) => {
        log.info('Module - validateAttendanceCreation Classrooms');

        // Validate schema
        log.info('Validating attendance model...')
        var attendance = new models.attendances(req.body);
        var error = attendance.validateSync();

        if (error) {
            log.error('Attendance model validation failed!');
            let err = new Error('Attendance Validation Failed!');
            err.status = 400;
            // Remove stack trace but retain detailed description of validation errors
            err.data = JSON.parse(JSON.stringify(error));
            next(err);
            return;
        }

        log.info('Attendance model has been validated!');
        next();
    },
	/**
     * Creates an Attendance
     * @param  {object}   req  Request object
     * @param  {object}   res  Response object
     * @param  {Function} next Callback function to move on to the next middleware
     */
	createAttendance: (req, res, next) => {
        log.info('Module - createAttendance Classrooms');

		log.info('Initializing students list');
		// assuming this is called directly after getting all of the students in the classroom.
		// populate list with request
		var students = res.locals;
		var presencesInput = req.body.presences;
		for (var ii = 0; ii < student.length; ii++) {
			var student = students[ii];
			presencesInput.push({'student': student, present: false});
		}
		req.body.presences = presencesInput;
		
        var attendance = new models.attendances(req.body);
        ctrls.mongodb.findById(models.classrooms, req.params.id, (err, classroom) => {
            if (err) {
                let err = new Error('Failed getting classroom: ' + req.params.id);
                err.status = 500;
                next(err);
                return;
            }
            log.info('Successfully found classroom [' + req.params.id + ']');

            log.info('Creating Attendance for classroom [' + req.params.id + ']');
            ctrls.mongodb.save(attendance, (err, result) => {
                if (err) {
                    let err = new Error('Error creating attendance for classroom [' + req.params.id + ']');
                    err.status = 500;
                    next(err);
                    return;
                }

                log.info('Successfully created attendance');
                res.locals = result;

                log.info('Adding attendance [' + result._id + '] to classroom [' + classroom._id + ']');
                classroom.attendanceHistory.push(result._id);

                ctrls.mongodb.save(classroom, (err, _result) => {
                    if (err) {
                        let err = new Error('Failed adding attendance [' + result._id + '] to classroom [' + classroom._id + ']');
                        err.status = 500;
                        next(err);
                        return;
                    }

                    log.info('Succesfully added attendance [' + result._id + '] to classroom [' + classroom._id + ']');
                    next();
                });
            });
        });
    },
	 /**
     * Gets all classroom attendances
     * @param  {object}   req  Request object
     * @param  {object}   res  Response object
     * @param  {Function} next Callback function to move on to the next middleware
     */
    getAllAttendances: (req, res, next) => {
        log.info('Module - getAllAttendances Classrooms');
        let populators = [{
            path: 'attendanceHistory'
        }];
        ctrls.mongodb.findByIdAndPopulate(models.classrooms, req.params.id, populators, (err, classroom) => {
            if (err) {
                let err = new Error('Failed getting classroom: ' + req.params.id);
                err.status = 500;
                next(err);
                return;
            }
            log.info('Successfully found classroom [' + req.params.id + ']');
            res.locals = classroom.attendanceHistory;
            next();
        });
    },
    /**
     * Gets all active classroom attendances
     * @param  {object}   req  Request object
     * @param  {object}   res  Response object
     * @param  {Function} next Callback function to move on to the next middleware
     */
    getAllActiveAttendances: (req, res, next) => {
        log.info('Module - getAllAttendances Classrooms');
        let populators = [{
            path: 'attendanceHistory'
        }];
        ctrls.mongodb.findByIdAndPopulate(models.classrooms, req.params.id, populators, (err, classroom) => {
            if (err) {
                let err = new Error('Failed getting classroom: ' + req.params.id);
                err.status = 500;
                next(err);
                return;
            }
            log.info('Successfully found classroom [' + req.params.id + ']');
            log.info('Filtering out non activated attendances');
            let attendances = [];
            for (let i = 0; i < classroom.attendanceHistory.length; i++) {
                if (classroom.attendanceHistory[i].activated) {
                    attendances.push(classroom.attendanceHistory[i]);
                }
            }
            res.locals = attendances;
            next();
        });
    },
    /**
     * Gets all classroom students
     * @param  {object}   req  Request object
     * @param  {object}   res  Response object
     * @param  {Function} next Callback function to move on to the next middleware
     */
    getAllStudents: (req, res, next) => {
        log.info('Module - getAllStudents Classrooms');
        let populators = [{
            path: 'students'
        }];
        ctrls.mongodb.findByIdAndPopulate(models.classrooms, req.params.id, populators, (err, classroom) => {
            if (err) {
                let err = new Error('Failed getting classroom: ' + req.params.id);
                err.status = 500;
                next(err);
                return;
            }
            log.info('Successfully found classroom [' + req.params.id + ']');
            res.locals = classroom.students;
            next();
        });
    },

    /**
     * Verifies teacher identity based on JWT
     * @param  {object}   req  Request object
     * @param  {object}   res  Response object
     * @param  {Function} next Callback function to move on to the next middleware
     */
    verifyTeacher: (req, res, next) => {
        log.info('Module - verifyTeacher Classrooms');
        if (!req.auth) {
            log.error('Missing req.auth decoded token');
            let err = new Error('Invalid Token for authentication, forbidden');
            err.status = 403;
            next(err);
            return;
        }

        if (req.auth.type !== 'teacher') {
            log.error('Invalid user type in token');
            let err = new Error('Unauthorized! Only teachers can access this data!');
            err.status = 401;
            next(err);
            return;
        }

        if (!ctrls.mongodb.isObjectId(req.auth.id)) {
            log.error('Token id is not a valid Mongo DB id');
            let err = new Error('Invalid Token for authentication');
            err.status = 401;
            next(err);
            return;
        }

        ctrls.mongodb.findById(models.classrooms, req.params.id, (err, result) => {
            if (err) {
                let err = new Error('Failed getting classroom: ' + req.params.id);
                err.status = 500;
                next(err);
                return;
            }
            log.info('Successfully found classroom [' + req.params.id + ']');

            if (!ctrls.mongodb.isEqual(req.auth.id, result.teacher)) {
                log.error('User is unauthorized to access this data.');
                let err = new Error('User is unauthorized to access this data.');
                err.status = 401;
                next(err);
                return;
            }

            log.info('Authorized');
            next();
        });
    },
    /**
     * Verifies identity teacher or student in classroom  based on JWT
     * @param  {object}   req  Request object
     * @param  {object}   res  Response object
     * @param  {Function} next Callback function to move on to the next middleware
     */
    verifyTeacherOrStudent: (req, res, next) => {
        log.info('Module - verifyTeacherOrStudent Classrooms');
        if (!req.auth) {
            log.error('Missing req.auth decoded token');
            let err = new Error('Invalid Token for authentication, forbidden');
            err.status = 403;
            next(err);
            return;
        }

        if (req.auth.type !== 'teacher' && req.auth.type !== 'student') {
            log.error('Invalid user type in token');
            let err = new Error('Invalid Token for authentication, forbidden');
            err.status = 403;
            next(err);
            return;
        }

        if (!ctrls.mongodb.isObjectId(req.auth.id)) {
            log.error('Token id is not a valid Mongo DB id');
            let err = new Error('Invalid Token for authentication');
            err.status = 401;
            next(err);
            return;
        }

        ctrls.mongodb.findById(models.classrooms, req.params.id, (err, result) => {
            if (err) {
                let err = new Error('Failed getting classroom: ' + req.params.id);
                err.status = 500;
                next(err);
                return;
            }
            log.info('Successfully found classroom [' + req.params.id + ']');


            if (req.auth.type === 'teacher') {
                if (!ctrls.mongodb.isEqual(req.auth.id, result.teacher)) {
                    log.error('User is unauthorized to access this data.');
                    let err = new Error('User is unauthorized to access this data.');
                    err.status = 401;
                    next(err);
                    return;
                }
            } else {
                if (result.students.indexOf(req.auth.id) < 0) {
                    log.error('User is unauthorized to access this data.');
                    let err = new Error('User is unauthorized to access this data.');
                    err.status = 401;
                    next(err);
                    return;
                }
            }
            log.info('Authorized');
            next();
        });
    }
};
