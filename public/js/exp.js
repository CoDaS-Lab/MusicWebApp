/* Modified from https://github.com/goldfire/howler.js/blob/master/examples/player/player.js */

$(document).ready(function (){

    var elms = ['track', 'timer', 'duration', "likeBtn", 'disLikeBtn','yesBtn', 'noBtn', 'playBtn', 'pauseBtn', 'volumeBtn', 'progress', 'bar', 'wave', 'loading', 'volume', 'barEmpty', 'barFull', 'sliderBtn'];
    var u_id, m_id, m_t, q, clean_str, startTime, endTime, music_route;
    var str = "Experiment Completed."
    var count = 0; //variable to store the count of characters in the user feedback
    var song_time = 10; // Playtime of the music available to the user
    var session = 1; // variable to track the session
    var session_time = 7; //variable to set the time limit of each session in the experiment
    var alpha = "50"; //variable to set the alpha value for the experiment
    var route = "https://music-develop.herokuapp.com"; // variable to store the backend api address
    var music_route2 = "/getRandomMusic"; //varable to store the route that returns randomly sampled music
    var music_route3 = "/getAlgoMusic"; //variable to store the route that returns recommended music
    var music_route = music_route2; //variable that stored the most current active route to be used in the experiment
    var timerStarted = false; // variable to keep track if the timer has started in each session.
    var exp_data = [];
    var exp_time = []; // time for the request to recieve a song
    var user_data = {'0':[], '1':[], 's':[]};
    var timr = new Timer();
    var song_timr = new Timer();
    var likeClick = false; // like click needs to be true along with dislike click for recommendation to start
    var dislikeClick = false; // dislike click needs to be true along with like click for recommendation to start

    elms.forEach(function(elm) {
        window[elm] = document.getElementById(elm);
    });

    var Player = function(playlist) {
      // Player class containing the state of our playlist and where we are in it
        this.playlist = playlist;
    };

    Player.prototype = {
        play: function() {
            var self = this;
            var sound;
            var data = self.playlist;
            if (timerStarted === false){
                console.log("timer initiated");
                timr.start({countdown: true, startValues: {minutes: session_time}});
                timr.reset();
                song_timr.start({countdown: true, startValues: {seconds: song_time}});
                timerStarted = true;
            }else{
                timr.start();
                song_timr.start();
            }
            if (data.howl) {
                sound = data.howl;
            } else {
                sound = data.howl = new Howl({
                    src: data.file,
                    html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
                    onplay: function() {
                        // Display the duration.
                        duration.innerHTML = self.formatTime(Math.round(song_time));
                        // Start upating the progress of the track.
                        requestAnimationFrame(self.step.bind(self));
                        $("#playBtn").hide();
                        $('#pauseBtn').show();
                        $("#waveform").show();
                        $("#bar").hide();
                    },
                    onload: function() {
                        console.log("onload initiated")
                        song_timr.reset();
                        timr.start();
                        $(".playr").show();
                        $(".choice").show();
                        $("#choice span").text("Music Feedback");
                        loading.style.display = 'none';
                    }
                });
            }
            sound.play();
            if (sound.state() === 'loaded') {
                //
            } else {
                $("#choice span").text("Loading Song");
                timr.pause();
            }
        },
        pause: function() {
            console.log("triggered pause");
            var self = this;
            // Get the Howl we want to manipulate.
            var sound = self.playlist.howl;
            // Pause the sound.
            sound.pause();
            timr.pause();
            song_timr.pause();
            $("#playBtn").show();
            $('#pauseBtn').hide();
            $("#waveform").hide();
            $("#bar").show();
        },
        load: function(){
            var self = this;
            // Get the Howl we want to manipulate.
            var sound = self.playlist.howl;
            // Pause the sound.
            sound.pause();
            timr.pause();
            song_timr.pause();
            $(".choice").hide();
            $(".playr").hide();
            $("#loading").show();
            $("#choice span").text("Getting a song for you.");
        },
        volume: function(val) {
            // Update the global volume (affecting all Howls).
            Howler.volume(val);
            // Update the display on the slider.
            var barWidth = (val * 90) / 100;
            barFull.style.width = (barWidth * 100) + '%';
            sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
        },
        step: function() {
            var self = this;
            // Get the Howl we want to manipulate.
            var sound = self.playlist.howl;
            // Determine our current seek position.
            var seek = sound.seek() || 0;
            timer.innerHTML = self.formatTime(Math.round(seek));
            progress.style.width = (((seek / Math.round(song_time)) * 100) || 0) + '%';
            // If the sound is still playing, continue stepping.
            if (sound.playing()) {
                requestAnimationFrame(self.step.bind(self));
            }
        },
        toggleVolume: function() {
            var display = (volume.style.display === 'block') ? 'none' : 'block';
            setTimeout(function() {
                volume.style.display = display;
            }, (display === 'block') ? 0 : 500);
            volume.className = (display === 'block') ? 'fadein' : 'fadeout';
        },
        formatTime: function(secs) {
            var minutes = Math.floor(secs / 60) || 0;
            var seconds = (secs - minutes * 60) || 0;
            return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
        },
        stop: function(){
            timr.pause();
            player.playlist.howl.pause();
            $("#choice span").text("Please provide your feedback")
            $(".playr").hide();
        }
    };

    var player = new Player(
        {
            howl: null
        },
    );

    var initiate_user = function () {
      // Create new user in the database and get user_id
        $.ajax({
            async: false,
            type: "GET",
            url: route+"/",
            crossDomain: true,
            success: function(data){
                u_id = data["u_id"];
            },
            failure: function(errMsg) {
                console.log(errMsg);
            }
        });
    };

    var initiate_music = function(){
      // Get the music url
        startTime = new Date().getSeconds();
        $.ajax({
            async: false,
            type: "POST",
            url: route+music_route,
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({"u_id" : u_id, "current_session":"s"+alpha+"_"+String(session), "alp":alpha}),
            dataType: "json",
            crossDomain: true,
            success: function(data){
                endTime = new Date().getSeconds();
                requestTime = endTime - startTime;
                exp_time.push(requestTime);
                m_id = data["m_id"];
                player.playlist["file"] = data["m_url"];
                player.playlist["howl"] = null;
                $("#volumeBtn").show();
                timer.innerHTML = "0:00"
                progress.style.width = '0%';

            },
            failure: function(errMsg) {
                console.log(errMsg);
            }
        });
    };

    var cleanText = function (str) {
      // Clean the text entered by user
        str = str.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");
        str = str.toLocaleLowerCase();
        str = str.split(" ");
        return str;
    };

    var processInput = function () {
      //cleans the text input provided by the user
        str = $(this).val();
        clean_str = cleanText(str);
        count = clean_str.length;
    };

    var actExpSmryBtn = function () {
      // Activates the button to visit experiment information page on clicking the box to agree on the experiment conditions
        if($(this).prop('checked') == true) {
            $("#cte a").toggleClass("disabled");
        }else{
            $("#cte a").toggleClass("disabled");
        }
    };

    var dsplyExpSmry = function () {
      //Display experiment information page
        if ($("#agree").prop('checked') == true) {
            $("#tmcn").hide();
            $("#mainInfo").show();
            $("#ssnTime").text(" "+String(session_time)+" ");
            initiate_user();
            $("#waveform").hide();
            initiate_music();
        } else {
            alert('Please indicate that you have read and agree to the Terms and Conditions and Privacy Policy');
        }
    };

    var loadExpPage = function(){
      // Load the experiment page
        $("#expmnt").show();
        $("body").addClass("body-exp");
        $("#ssnTime").text(" "+String(session_time)+" ");
        $('#cdTime').text(" 00:"+String(session_time)+":00");
        $('#cdTitle').text(" "+String(session)+" ");
    }

    var strtExp = function () {
      // Start the first session in experiment
        $("#mainInfo").hide();
        loadExpPage();
    };

    var strtScndSn = function () {
      // Start the second session in experiment
        $("#snalert").hide();
        loadExpPage();
        initiate_music();
        player.play();
    };

    var ssnAlrt = function () {
      // Changes page layout on completion of session time
        console.log("targetAchieved: Session Completed");
        $(".playr").hide();
        $('#cdTime').text(" 00:00:00");
        $('#cdTitle').text(" Completed ");
        timerStarted = false;
    };

    var move = function(event) {
      // Change the volume on moving the slider
        if (window.sliderDown) {
            var x = event.clientX || event.touches[0].clientX;
            var startX = window.innerWidth * 0.05;
            var layerX = x - startX;
            var per = Math.min(1, Math.max(0, layerX / parseFloat(barEmpty.scrollWidth)));
            player.volume(per);
        }
    };

    var save_feedback = function(feedback){
      // Save the music feedback provided by the user for each music
        Array.prototype.push.apply(m_id, [m_t, "s"+alpha+"_"+String(session), feedback])
        console.log(m_id);
        user_data[String(feedback)].push(m_id);
        user_data['s'].push(m_id);
        $.ajax({
            type: "POST",
            url: route+"/sendChoice",
            crossDomain:true,
            data: JSON.stringify({"u_id" : u_id, "current_session":"s"+alpha+"_"+String(session), "m_id" :m_id}),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(data){
                if (timerStarted==true){
                    if (session==2 && dislikeClick==true && likeClick==true){
                        music_route = music_route3;
                    }
                    initiate_music();
                    player.play();
                }
                else if (timerStarted==false){
                    $("#expmnt").hide();
                    $("body").removeClass("body-exp");
                    exp_data.push(user_data);
                    exp_time = [];
                    user_data = {'1':[], '0':[], 's':[]};
                    if (session==1){
                        $("#snalert").show();
                        session = session+1;
                        likeClick = false;
                        dislikeClick = false;
                        music_route = music_route2;
                    }
                    else if(session==2){
                        $("#expcls").show();
                    }
                }
            },
            failure: function(errMsg) {console.log(errMsg);}
        });
    }

    var resize = function() {
      // Update the height of the wave animation.
        var height = window.innerHeight * 0.3;
        var width = window.innerWidth;
        wave.height = height;
        wave.height_2 = height / 2;
        wave.MAX = wave.height_2 - 4;
        wave.width = width;
        wave.width_2 = width / 2;
        wave.width_4 = width / 4;
        wave.canvas.height = height;
        wave.canvas.width = width;
        wave.container.style.margin = -(height / 2) + 'px auto';

        // Update the position of the slider.
        var sound = player.playlist.howl;
        if (sound) {
            var vol = sound.volume();
            var barWidth = (vol * 0.9);
            sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
        }
    };

    var wave = new SiriWave({
      // Setup the "waveform" animation.
        container: waveform,
        width: window.innerWidth,
        height: window.innerHeight * 0.5,
        cover: true,
        speed: 0.03,
        amplitude: 1,
        frequency: 1
    });

    $("#agree").change(actExpSmryBtn); // Activates the button to go to the experiment information page
    $("#cte").on("click", dsplyExpSmry); // Display the experiment  information page
    $("#stExp").on("click", strtExp); // Display the experiment page
    $("#snst").on("click", strtScndSn); // Start the second session of the sxperiment

    song_timr.addEventListener('targetAchieved', function () {
      // Stop playing the music after completing the target time
        m_t = JSON.stringify(player.playlist.howl.seek());
        player.stop();
    });
    song_timr.addEventListener('secondTenthsUpdated', function() {
      // Update the current playtime of the music
        console.log(song_timr.getTimeValues().toString());
        m_t = JSON.stringify(player.playlist.howl.seek());
    });
    timr.addEventListener('secondTenthsUpdated', function() {
      // Update the current time of the session
        $('#cdTime').text(" "+ timr.getTimeValues().toString());
    });
    timr.addEventListener('targetAchieved', ssnAlrt); // Changes to the UI to alert the user about the session complete
    likeBtn.addEventListener('click', function() {
      // send the like feedback to the api
        if (player.playlist.howl.seek() >0){
            likeClick = true;
            player.load();
            save_feedback(1);
        }
    });
    disLikeBtn.addEventListener('click', function() {
      // send the dislike feedback to the api
        if (player.playlist.howl.seek() >0){
            dislikeClick = true;
            player.load();
            save_feedback(0);
        }
    });
    volume.addEventListener('mousemove', move);
    volume.addEventListener('touchmove', move);
    volume.addEventListener('mouseup', function() {
        // Change the Volume
        window.sliderDown = false;
    });
    volume.addEventListener('touchend', function() {
      // Change the Volume
        window.sliderDown = false;
    });
    playBtn.addEventListener('click', function() {
      //Start playing the music
        player.play();
    });
    pauseBtn.addEventListener('click', function() {
      //Pause playing the music
        player.pause();
    });
    volumeBtn.addEventListener('click', function() {
        player.toggleVolume();
    });
    volume.addEventListener('click', function() {
        player.toggleVolume();
    });
    sliderBtn.addEventListener('mousedown', function() {
        window.sliderDown = true;
    });
    sliderBtn.addEventListener('touchstart', function() {
        window.sliderDown = true;
    });
    barEmpty.addEventListener('click', function(event) {
        var per = event.layerX / parseFloat(barEmpty.scrollWidth);
        player.volume(per);
    });
    window.addEventListener('resize', resize);

    $("textarea").on("keyup", processInput); //process the user feedback input in the text area.

    $("#feedbackSbmt").on("click", function(){
      // Sends user feedback to API
        if (count<=200){
            $.ajax({
                type: "POST",
                url: route+"/feedback",
                crossDomain:true,
                data: JSON.stringify({"comment":str,"u_id" : u_id}),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function(data){console.log("got the data"+data);},
                failure: function(errMsg){
                    console.log(errMsg);
                }
            });
            turk.submit(exp_data);
        }else {
            alert("The feedback is longer than the allowed maximum length of 200 characters for submission.");
        }
    });
    wave.start();
    resize();
});
