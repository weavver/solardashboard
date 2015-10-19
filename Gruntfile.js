module.exports = function (grunt) {
    
    // Project configuration.
    grunt.initConfig({
        concurrent: {
            dev: ["nodemon", "watch"],
            options: {
                logConcurrentOutput: true
            }
        },
        nodemon: {
                dev: {
                    script: 'app.js',
                    ignore: ['units/**']
               }
        },
        watch: {
            js: {
                files: ["app.js"],
                //tasks: ['nodemon'],
                options: { nospawn: true, livereload: true }
            }
        }
    });

     grunt.loadNpmTasks('grunt-concurrent');
     grunt.loadNpmTasks('grunt-nodemon');
};