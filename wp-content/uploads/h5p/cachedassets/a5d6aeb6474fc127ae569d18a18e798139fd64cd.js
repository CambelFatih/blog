var H5P = H5P || {};
/**
 * Transition contains helper function relevant for transitioning
 */
H5P.Transition = (function ($) {

  /**
   * @class
   * @namespace H5P
   */
  Transition = {};

  /**
   * @private
   */
  Transition.transitionEndEventNames = {
    'WebkitTransition': 'webkitTransitionEnd',
    'transition':       'transitionend',
    'MozTransition':    'transitionend',
    'OTransition':      'oTransitionEnd',
    'msTransition':     'MSTransitionEnd'
  };

  /**
   * @private
   */
  Transition.cache = [];

  /**
   * Get the vendor property name for an event
   *
   * @function H5P.Transition.getVendorPropertyName
   * @static
   * @private
   * @param  {string} prop Generic property name
   * @return {string}      Vendor specific property name
   */
  Transition.getVendorPropertyName = function (prop) {

    if (Transition.cache[prop] !== undefined) {
      return Transition.cache[prop];
    }

    var div = document.createElement('div');

    // Handle unprefixed versions (FF16+, for example)
    if (prop in div.style) {
      Transition.cache[prop] = prop;
    }
    else {
      var prefixes = ['Moz', 'Webkit', 'O', 'ms'];
      var prop_ = prop.charAt(0).toUpperCase() + prop.substr(1);

      if (prop in div.style) {
        Transition.cache[prop] = prop;
      }
      else {
        for (var i = 0; i < prefixes.length; ++i) {
          var vendorProp = prefixes[i] + prop_;
          if (vendorProp in div.style) {
            Transition.cache[prop] = vendorProp;
            break;
          }
        }
      }
    }

    return Transition.cache[prop];
  };

  /**
   * Get the name of the transition end event
   *
   * @static
   * @private
   * @return {string}  description
   */
  Transition.getTransitionEndEventName = function () {
    return Transition.transitionEndEventNames[Transition.getVendorPropertyName('transition')] || undefined;
  };

  /**
   * Helper function for listening on transition end events
   *
   * @function H5P.Transition.onTransitionEnd
   * @static
   * @param  {domElement} $element The element which is transitioned
   * @param  {function} callback The callback to be invoked when transition is finished
   * @param  {number} timeout  Timeout in milliseconds. Fallback if transition event is never fired
   */
  Transition.onTransitionEnd = function ($element, callback, timeout) {
    // Fallback on 1 second if transition event is not supported/triggered
    timeout = timeout || 1000;
    Transition.transitionEndEventName = Transition.transitionEndEventName || Transition.getTransitionEndEventName();
    var callbackCalled = false;

    var doCallback = function () {
      if (callbackCalled) {
        return;
      }
      $element.off(Transition.transitionEndEventName, callback);
      callbackCalled = true;
      clearTimeout(timer);
      callback();
    };

    var timer = setTimeout(function () {
      doCallback();
    }, timeout);

    $element.on(Transition.transitionEndEventName, function () {
      doCallback();
    });
  };

  /**
   * Wait for a transition - when finished, invokes next in line
   *
   * @private
   *
   * @param {Object[]}    transitions             Array of transitions
   * @param {H5P.jQuery}  transitions[].$element  Dom element transition is performed on
   * @param {number=}     transitions[].timeout   Timeout fallback if transition end never is triggered
   * @param {bool=}       transitions[].break     If true, sequence breaks after this transition
   * @param {number}      index                   The index for current transition
   */
  var runSequence = function (transitions, index) {
    if (index >= transitions.length) {
      return;
    }

    var transition = transitions[index];
    H5P.Transition.onTransitionEnd(transition.$element, function () {
      if (transition.end) {
        transition.end();
      }
      if (transition.break !== true) {
        runSequence(transitions, index+1);
      }
    }, transition.timeout || undefined);
  };

  /**
   * Run a sequence of transitions
   *
   * @function H5P.Transition.sequence
   * @static
   * @param {Object[]}    transitions             Array of transitions
   * @param {H5P.jQuery}  transitions[].$element  Dom element transition is performed on
   * @param {number=}     transitions[].timeout   Timeout fallback if transition end never is triggered
   * @param {bool=}       transitions[].break     If true, sequence breaks after this transition
   */
  Transition.sequence = function (transitions) {
    runSequence(transitions, 0);
  };

  return Transition;
})(H5P.jQuery);
;
var H5P = H5P || {};

/**
 * Class responsible for creating a help text dialog
 */
H5P.JoubelHelpTextDialog = (function ($) {

  var numInstances = 0;
  /**
   * Display a pop-up containing a message.
   *
   * @param {H5P.jQuery}  $container  The container which message dialog will be appended to
   * @param {string}      message     The message
   * @param {string}      closeButtonTitle The title for the close button
   * @return {H5P.jQuery}
   */
  function JoubelHelpTextDialog(header, message, closeButtonTitle) {
    H5P.EventDispatcher.call(this);

    var self = this;

    numInstances++;
    var headerId = 'joubel-help-text-header-' + numInstances;
    var helpTextId = 'joubel-help-text-body-' + numInstances;

    var $helpTextDialogBox = $('<div>', {
      'class': 'joubel-help-text-dialog-box',
      'role': 'dialog',
      'aria-labelledby': headerId,
      'aria-describedby': helpTextId
    });

    $('<div>', {
      'class': 'joubel-help-text-dialog-background'
    }).appendTo($helpTextDialogBox);

    var $helpTextDialogContainer = $('<div>', {
      'class': 'joubel-help-text-dialog-container'
    }).appendTo($helpTextDialogBox);

    $('<div>', {
      'class': 'joubel-help-text-header',
      'id': headerId,
      'role': 'header',
      'html': header
    }).appendTo($helpTextDialogContainer);

    $('<div>', {
      'class': 'joubel-help-text-body',
      'id': helpTextId,
      'html': message,
      'role': 'document',
      'tabindex': 0
    }).appendTo($helpTextDialogContainer);

    var handleClose = function () {
      $helpTextDialogBox.remove();
      self.trigger('closed');
    };

    var $closeButton = $('<div>', {
      'class': 'joubel-help-text-remove',
      'role': 'button',
      'title': closeButtonTitle,
      'tabindex': 1,
      'click': handleClose,
      'keydown': function (event) {
        // 32 - space, 13 - enter
        if ([32, 13].indexOf(event.which) !== -1) {
          event.preventDefault();
          handleClose();
        }
      }
    }).appendTo($helpTextDialogContainer);

    /**
     * Get the DOM element
     * @return {HTMLElement}
     */
    self.getElement = function () {
      return $helpTextDialogBox;
    };

    self.focus = function () {
      $closeButton.focus();
    };
  }

  JoubelHelpTextDialog.prototype = Object.create(H5P.EventDispatcher.prototype);
  JoubelHelpTextDialog.prototype.constructor = JoubelHelpTextDialog;

  return JoubelHelpTextDialog;
}(H5P.jQuery));
;
var H5P = H5P || {};

/**
 * Class responsible for creating auto-disappearing dialogs
 */
H5P.JoubelMessageDialog = (function ($) {

  /**
   * Display a pop-up containing a message.
   *
   * @param {H5P.jQuery} $container The container which message dialog will be appended to
   * @param {string} message The message
   * @return {H5P.jQuery}
   */
  function JoubelMessageDialog ($container, message) {
    var timeout;

    var removeDialog = function () {
      $warning.remove();
      clearTimeout(timeout);
      $container.off('click.messageDialog');
    };

    // Create warning popup:
    var $warning = $('<div/>', {
      'class': 'joubel-message-dialog',
      text: message
    }).appendTo($container);

    // Remove after 3 seconds or if user clicks anywhere in $container:
    timeout = setTimeout(removeDialog, 3000);
    $container.on('click.messageDialog', removeDialog);

    return $warning;
  }

  return JoubelMessageDialog;
})(H5P.jQuery);
;
var H5P = H5P || {};

/**
 * Class responsible for creating a circular progress bar
 */

H5P.JoubelProgressCircle = (function ($) {

  /**
   * Constructor for the Progress Circle
   *
   * @param {Number} number The amount of progress to display
   * @param {string} progressColor Color for the progress meter
   * @param {string} backgroundColor Color behind the progress meter
   */
  function ProgressCircle(number, progressColor, fillColor, backgroundColor) {
    progressColor = progressColor || '#1a73d9';
    fillColor = fillColor || '#f0f0f0';
    backgroundColor = backgroundColor || '#ffffff';
    var progressColorRGB = this.hexToRgb(progressColor);

    //Verify number
    try {
      number = Number(number);
      if (number === '') {
        throw 'is empty';
      }
      if (isNaN(number)) {
        throw 'is not a number';
      }
    } catch (e) {
      number = 'err';
    }

    //Draw circle
    if (number > 100) {
      number = 100;
    }

    // We can not use rgba, since they will stack on top of each other.
    // Instead we create the equivalent of the rgba color
    // and applies this to the activeborder and background color.
    var progressColorString = 'rgb(' + parseInt(progressColorRGB.r, 10) +
      ',' + parseInt(progressColorRGB.g, 10) +
      ',' + parseInt(progressColorRGB.b, 10) + ')';

    // Circle wrapper
    var $wrapper = $('<div/>', {
      'class': "joubel-progress-circle-wrapper"
    });

    //Active border indicates progress
    var $activeBorder = $('<div/>', {
      'class': "joubel-progress-circle-active-border"
    }).appendTo($wrapper);

    //Background circle
    var $backgroundCircle = $('<div/>', {
      'class': "joubel-progress-circle-circle"
    }).appendTo($activeBorder);

    //Progress text/number
    $('<span/>', {
      'text': number + '%',
      'class': "joubel-progress-circle-percentage"
    }).appendTo($backgroundCircle);

    var deg = number * 3.6;
    if (deg <= 180) {
      $activeBorder.css('background-image',
        'linear-gradient(' + (90 + deg) + 'deg, transparent 50%, ' + fillColor + ' 50%),' +
        'linear-gradient(90deg, ' + fillColor + ' 50%, transparent 50%)')
        .css('border', '2px solid' + backgroundColor)
        .css('background-color', progressColorString);
    } else {
      $activeBorder.css('background-image',
        'linear-gradient(' + (deg - 90) + 'deg, transparent 50%, ' + progressColorString + ' 50%),' +
        'linear-gradient(90deg, ' + fillColor + ' 50%, transparent 50%)')
        .css('border', '2px solid' + backgroundColor)
        .css('background-color', progressColorString);
    }

    this.$activeBorder = $activeBorder;
    this.$backgroundCircle = $backgroundCircle;
    this.$wrapper = $wrapper;

    this.initResizeFunctionality();

    return $wrapper;
  }

  /**
   * Initializes resize functionality for the progress circle
   */
  ProgressCircle.prototype.initResizeFunctionality = function () {
    var self = this;

    $(window).resize(function () {
      // Queue resize
      setTimeout(function () {
        self.resize();
      });
    });

    // First resize
    setTimeout(function () {
      self.resize();
    }, 0);
  };

  /**
   * Resize function makes progress circle grow or shrink relative to parent container
   */
  ProgressCircle.prototype.resize = function () {
    var $parent = this.$wrapper.parent();

    if ($parent !== undefined && $parent) {

      // Measurements
      var fontSize = parseInt($parent.css('font-size'), 10);

      // Static sizes
      var fontSizeMultiplum = 3.75;
      var progressCircleWidthPx = parseInt((fontSize / 4.5), 10) % 2 === 0 ? parseInt((fontSize / 4.5), 10) + 4 : parseInt((fontSize / 4.5), 10) + 5;
      var progressCircleOffset = progressCircleWidthPx / 2;

      var width = fontSize * fontSizeMultiplum;
      var height = fontSize * fontSizeMultiplum;
      this.$activeBorder.css({
        'width': width,
        'height': height
      });

      this.$backgroundCircle.css({
        'width': width - progressCircleWidthPx,
        'height': height - progressCircleWidthPx,
        'top': progressCircleOffset,
        'left': progressCircleOffset
      });
    }
  };

  /**
   * Hex to RGB conversion
   * @param hex
   * @returns {{r: Number, g: Number, b: Number}}
   */
  ProgressCircle.prototype.hexToRgb = function (hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  return ProgressCircle;

}(H5P.jQuery));
;
var H5P = H5P || {};

H5P.SimpleRoundedButton = (function ($) {

  /**
   * Creates a new tip
   */
  function SimpleRoundedButton(text) {

    var $simpleRoundedButton = $('<div>', {
      'class': 'joubel-simple-rounded-button',
      'title': text,
      'role': 'button',
      'tabindex': '0'
    }).keydown(function (e) {
      // 32 - space, 13 - enter
      if ([32, 13].indexOf(e.which) !== -1) {
        $(this).click();
        e.preventDefault();
      }
    });

    $('<span>', {
      'class': 'joubel-simple-rounded-button-text',
      'html': text
    }).appendTo($simpleRoundedButton);

    return $simpleRoundedButton;
  }

  return SimpleRoundedButton;
}(H5P.jQuery));
;
var H5P = H5P || {};

/**
 * Class responsible for creating speech bubbles
 */
H5P.JoubelSpeechBubble = (function ($) {

  var $currentSpeechBubble;
  var $currentContainer;  
  var $tail;
  var $innerTail;
  var removeSpeechBubbleTimeout;
  var currentMaxWidth;

  var DEFAULT_MAX_WIDTH = 400;

  var iDevice = navigator.userAgent.match(/iPod|iPhone|iPad/g) ? true : false;

  /**
   * Creates a new speech bubble
   *
   * @param {H5P.jQuery} $container The speaking object
   * @param {string} text The text to display
   * @param {number} maxWidth The maximum width of the bubble
   * @return {H5P.JoubelSpeechBubble}
   */
  function JoubelSpeechBubble($container, text, maxWidth) {
    maxWidth = maxWidth || DEFAULT_MAX_WIDTH;
    currentMaxWidth = maxWidth;
    $currentContainer = $container;

    this.isCurrent = function ($tip) {
      return $tip.is($currentContainer);
    };

    this.remove = function () {
      remove();
    };

    var fadeOutSpeechBubble = function ($speechBubble) {
      if (!$speechBubble) {
        return;
      }

      // Stop removing bubble
      clearTimeout(removeSpeechBubbleTimeout);

      $speechBubble.removeClass('show');
      setTimeout(function () {
        if ($speechBubble) {
          $speechBubble.remove();
          $speechBubble = undefined;
        }
      }, 500);
    };

    if ($currentSpeechBubble !== undefined) {
      remove();
    }

    var $h5pContainer = getH5PContainer($container);

    // Make sure we fade out old speech bubble
    fadeOutSpeechBubble($currentSpeechBubble);

    // Create bubble
    $tail = $('<div class="joubel-speech-bubble-tail"></div>');
    $innerTail = $('<div class="joubel-speech-bubble-inner-tail"></div>');
    var $innerBubble = $(
      '<div class="joubel-speech-bubble-inner">' +
      '<div class="joubel-speech-bubble-text">' + text + '</div>' +
      '</div>'
    ).prepend($innerTail);

    $currentSpeechBubble = $(
      '<div class="joubel-speech-bubble" aria-live="assertive">'
    ).append([$tail, $innerBubble])
      .appendTo($h5pContainer);

    // Show speech bubble with transition
    setTimeout(function () {
      $currentSpeechBubble.addClass('show');
    }, 0);

    position($currentSpeechBubble, $currentContainer, maxWidth, $tail, $innerTail);

    // Handle click to close
    H5P.$body.on('mousedown.speechBubble', handleOutsideClick);

    // Handle window resizing
    H5P.$window.on('resize', '', handleResize);

    // Handle clicks when inside IV which blocks bubbling.
    $container.parents('.h5p-dialog')
      .on('mousedown.speechBubble', handleOutsideClick);

    if (iDevice) {
      H5P.$body.css('cursor', 'pointer');
    }

    return this;
  }

  // Remove speechbubble if it belongs to a dom element that is about to be hidden
  H5P.externalDispatcher.on('domHidden', function (event) {
    if ($currentSpeechBubble !== undefined && event.data.$dom.find($currentContainer).length !== 0) {
      remove();
    }
  });

  /**
   * Returns the closest h5p container for the given DOM element.
   * 
   * @param {object} $container jquery element
   * @return {object} the h5p container (jquery element)
   */
  function getH5PContainer($container) {
    var $h5pContainer = $container.closest('.h5p-frame');

    // Check closest h5p frame first, then check for container in case there is no frame.
    if (!$h5pContainer.length) {
      $h5pContainer = $container.closest('.h5p-container');
    }

    return $h5pContainer;
  }

  /**
   * Event handler that is called when the window is resized.
   */
  function handleResize() {
    position($currentSpeechBubble, $currentContainer, currentMaxWidth, $tail, $innerTail);
  }

  /**
   * Repositions the speech bubble according to the position of the container.
   * 
   * @param {object} $currentSpeechbubble the speech bubble that should be positioned   
   * @param {object} $container the container to which the speech bubble should point 
   * @param {number} maxWidth the maximum width of the speech bubble
   * @param {object} $tail the tail (the triangle that points to the referenced container)
   * @param {object} $innerTail the inner tail (the triangle that points to the referenced container)
   */
  function position($currentSpeechBubble, $container, maxWidth, $tail, $innerTail) {
    var $h5pContainer = getH5PContainer($container);

    // Calculate offset between the button and the h5p frame
    var offset = getOffsetBetween($h5pContainer, $container);

    var direction = (offset.bottom > offset.top ? 'bottom' : 'top');
    var tipWidth = offset.outerWidth * 0.9; // Var needs to be renamed to make sense
    var bubbleWidth = tipWidth > maxWidth ? maxWidth : tipWidth;

    var bubblePosition = getBubblePosition(bubbleWidth, offset);
    var tailPosition = getTailPosition(bubbleWidth, bubblePosition, offset, $container.width());
    // Need to set font-size, since element is appended to body.
    // Using same font-size as parent. In that way it will grow accordingly
    // when resizing
    var fontSize = 16;//parseFloat($parent.css('font-size'));

    // Set width and position of speech bubble
    $currentSpeechBubble.css(bubbleCSS(
      direction,
      bubbleWidth,
      bubblePosition,
      fontSize
    ));

    var preparedTailCSS = tailCSS(direction, tailPosition);
    $tail.css(preparedTailCSS);
    $innerTail.css(preparedTailCSS);
  }

  /**
   * Static function for removing the speechbubble
   */
  var remove = function () {
    H5P.$body.off('mousedown.speechBubble');
    H5P.$window.off('resize', '', handleResize);
    $currentContainer.parents('.h5p-dialog').off('mousedown.speechBubble');
    if (iDevice) {
      H5P.$body.css('cursor', '');
    }
    if ($currentSpeechBubble !== undefined) {
      // Apply transition, then remove speech bubble
      $currentSpeechBubble.removeClass('show');

      // Make sure we remove any old timeout before reassignment
      clearTimeout(removeSpeechBubbleTimeout);
      removeSpeechBubbleTimeout = setTimeout(function () {
        $currentSpeechBubble.remove();
        $currentSpeechBubble = undefined;
      }, 500);
    }
    // Don't return false here. If the user e.g. clicks a button when the bubble is visible,
    // we want the bubble to disapear AND the button to receive the event
  };

  /**
   * Remove the speech bubble and container reference
   */
  function handleOutsideClick(event) {
    if (event.target === $currentContainer[0]) {
      return; // Button clicks are not outside clicks
    }

    remove();
    // There is no current container when a container isn't clicked
    $currentContainer = undefined;
  }

  /**
   * Calculate position for speech bubble
   *
   * @param {number} bubbleWidth The width of the speech bubble
   * @param {object} offset
   * @return {object} Return position for the speech bubble
   */
  function getBubblePosition(bubbleWidth, offset) {
    var bubblePosition = {};

    var tailOffset = 9;
    var widthOffset = bubbleWidth / 2;

    // Calculate top position
    bubblePosition.top = offset.top + offset.innerHeight;

    // Calculate bottom position
    bubblePosition.bottom = offset.bottom + offset.innerHeight + tailOffset;

    // Calculate left position
    if (offset.left < widthOffset) {
      bubblePosition.left = 3;
    }
    else if ((offset.left + widthOffset) > offset.outerWidth) {
      bubblePosition.left = offset.outerWidth - bubbleWidth - 3;
    }
    else {
      bubblePosition.left = offset.left - widthOffset + (offset.innerWidth / 2);
    }

    return bubblePosition;
  }

  /**
   * Calculate position for speech bubble tail
   *
   * @param {number} bubbleWidth The width of the speech bubble
   * @param {object} bubblePosition Speech bubble position
   * @param {object} offset
   * @param {number} iconWidth The width of the tip icon
   * @return {object} Return position for the tail
   */
  function getTailPosition(bubbleWidth, bubblePosition, offset, iconWidth) {
    var tailPosition = {};
    // Magic numbers. Tuned by hand so that the tail fits visually within
    // the bounds of the speech bubble.
    var leftBoundary = 9;
    var rightBoundary = bubbleWidth - 20;

    tailPosition.left = offset.left - bubblePosition.left + (iconWidth / 2) - 6;
    if (tailPosition.left < leftBoundary) {
      tailPosition.left = leftBoundary;
    }
    if (tailPosition.left > rightBoundary) {
      tailPosition.left = rightBoundary;
    }

    tailPosition.top = -6;
    tailPosition.bottom = -6;

    return tailPosition;
  }

  /**
   * Return bubble CSS for the desired growth direction
   *
   * @param {string} direction The direction the speech bubble will grow
   * @param {number} width The width of the speech bubble
   * @param {object} position Speech bubble position
   * @param {number} fontSize The size of the bubbles font
   * @return {object} Return CSS
   */
  function bubbleCSS(direction, width, position, fontSize) {
    if (direction === 'top') {
      return {
        width: width + 'px',
        bottom: position.bottom + 'px',
        left: position.left + 'px',
        fontSize: fontSize + 'px',
        top: ''
      };
    }
    else {
      return {
        width: width + 'px',
        top: position.top + 'px',
        left: position.left + 'px',
        fontSize: fontSize + 'px',
        bottom: ''
      };
    }
  }

  /**
   * Return tail CSS for the desired growth direction
   *
   * @param {string} direction The direction the speech bubble will grow
   * @param {object} position Tail position
   * @return {object} Return CSS
   */
  function tailCSS(direction, position) {
    if (direction === 'top') {
      return {
        bottom: position.bottom + 'px',
        left: position.left + 'px',
        top: ''
      };
    }
    else {
      return {
        top: position.top + 'px',
        left: position.left + 'px',
        bottom: ''
      };
    }
  }

  /**
   * Calculates the offset between an element inside a container and the
   * container. Only works if all the edges of the inner element are inside the
   * outer element.
   * Width/height of the elements is included as a convenience.
   *
   * @param {H5P.jQuery} $outer
   * @param {H5P.jQuery} $inner
   * @return {object} Position offset
   */
  function getOffsetBetween($outer, $inner) {
    var outer = $outer[0].getBoundingClientRect();
    var inner = $inner[0].getBoundingClientRect();

    return {
      top: inner.top - outer.top,
      right: outer.right - inner.right,
      bottom: outer.bottom - inner.bottom,
      left: inner.left - outer.left,
      innerWidth: inner.width,
      innerHeight: inner.height,
      outerWidth: outer.width,
      outerHeight: outer.height
    };
  }

  return JoubelSpeechBubble;
})(H5P.jQuery);
;
var H5P = H5P || {};

H5P.JoubelThrobber = (function ($) {

  /**
   * Creates a new tip
   */
  function JoubelThrobber() {

    // h5p-throbber css is described in core
    var $throbber = $('<div/>', {
      'class': 'h5p-throbber'
    });

    return $throbber;
  }

  return JoubelThrobber;
}(H5P.jQuery));
;
H5P.JoubelTip = (function ($) {
  var $conv = $('<div/>');

  /**
   * Creates a new tip element.
   *
   * NOTE that this may look like a class but it doesn't behave like one.
   * It returns a jQuery object.
   *
   * @param {string} tipHtml The text to display in the popup
   * @param {Object} [behaviour] Options
   * @param {string} [behaviour.tipLabel] Set to use a custom label for the tip button (you want this for good A11Y)
   * @param {boolean} [behaviour.helpIcon] Set to 'true' to Add help-icon classname to Tip button (changes the icon)
   * @param {boolean} [behaviour.showSpeechBubble] Set to 'false' to disable functionality (you may this in the editor)
   * @param {boolean} [behaviour.tabcontrol] Set to 'true' if you plan on controlling the tabindex in the parent (tabindex="-1")
   * @return {H5P.jQuery|undefined} Tip button jQuery element or 'undefined' if invalid tip
   */
  function JoubelTip(tipHtml, behaviour) {

    // Keep track of the popup that appears when you click the Tip button
    var speechBubble;

    // Parse tip html to determine text
    var tipText = $conv.html(tipHtml).text().trim();
    if (tipText === '') {
      return; // The tip has no textual content, i.e. it's invalid.
    }

    // Set default behaviour
    behaviour = $.extend({
      tipLabel: tipText,
      helpIcon: false,
      showSpeechBubble: true,
      tabcontrol: false
    }, behaviour);

    // Create Tip button
    var $tipButton = $('<div/>', {
      class: 'joubel-tip-container' + (behaviour.showSpeechBubble ? '' : ' be-quiet'),
      'aria-label': behaviour.tipLabel,
      'aria-expanded': false,
      role: 'button',
      tabindex: (behaviour.tabcontrol ? -1 : 0),
      click: function (event) {
        // Toggle show/hide popup
        toggleSpeechBubble();
        event.preventDefault();
      },
      keydown: function (event) {
        if (event.which === 32 || event.which === 13) { // Space & enter key
          // Toggle show/hide popup
          toggleSpeechBubble();
          event.stopPropagation();
          event.preventDefault();
        }
        else { // Any other key
          // Toggle hide popup
          toggleSpeechBubble(false);
        }
      },
      // Add markup to render icon
      html: '<span class="joubel-icon-tip-normal ' + (behaviour.helpIcon ? ' help-icon': '') + '">' +
              '<span class="h5p-icon-shadow"></span>' +
              '<span class="h5p-icon-speech-bubble"></span>' +
              '<span class="h5p-icon-info"></span>' +
            '</span>'
      // IMPORTANT: All of the markup elements must have 'pointer-events: none;'
    });

    const $tipAnnouncer = $('<div>', {
      'class': 'hidden-but-read',
      'aria-live': 'polite',
      appendTo: $tipButton,
    });

    /**
     * Tip button interaction handler.
     * Toggle show or hide the speech bubble popup when interacting with the
     * Tip button.
     *
     * @private
     * @param {boolean} [force] 'true' shows and 'false' hides.
     */
    var toggleSpeechBubble = function (force) {
      if (speechBubble !== undefined && speechBubble.isCurrent($tipButton)) {
        // Hide current popup
        speechBubble.remove();
        speechBubble = undefined;

        $tipButton.attr('aria-expanded', false);
        $tipAnnouncer.html('');
      }
      else if (force !== false && behaviour.showSpeechBubble) {
        // Create and show new popup
        speechBubble = H5P.JoubelSpeechBubble($tipButton, tipHtml);
        $tipButton.attr('aria-expanded', true);
        $tipAnnouncer.html(tipHtml);
      }
    };

    return $tipButton;
  }

  return JoubelTip;
})(H5P.jQuery);
;
var H5P = H5P || {};

H5P.JoubelSlider = (function ($) {

  /**
   * Creates a new Slider
   *
   * @param {object} [params] Additional parameters
   */
  function JoubelSlider(params) {
    H5P.EventDispatcher.call(this);

    this.$slider = $('<div>', $.extend({
      'class': 'h5p-joubel-ui-slider'
    }, params));

    this.$slides = [];
    this.currentIndex = 0;
    this.numSlides = 0;
  }
  JoubelSlider.prototype = Object.create(H5P.EventDispatcher.prototype);
  JoubelSlider.prototype.constructor = JoubelSlider;

  JoubelSlider.prototype.addSlide = function ($content) {
    $content.addClass('h5p-joubel-ui-slide').css({
      'left': (this.numSlides*100) + '%'
    });
    this.$slider.append($content);
    this.$slides.push($content);

    this.numSlides++;

    if(this.numSlides === 1) {
      $content.addClass('current');
    }
  };

  JoubelSlider.prototype.attach = function ($container) {
    $container.append(this.$slider);
  };

  JoubelSlider.prototype.move = function (index) {
    var self = this;

    if(index === 0) {
      self.trigger('first-slide');
    }
    if(index+1 === self.numSlides) {
      self.trigger('last-slide');
    }
    self.trigger('move');

    var $previousSlide = self.$slides[this.currentIndex];
    H5P.Transition.onTransitionEnd(this.$slider, function () {
      $previousSlide.removeClass('current');
      self.trigger('moved');
    });
    this.$slides[index].addClass('current');

    var translateX = 'translateX(' + (-index*100) + '%)';
    this.$slider.css({
      '-webkit-transform': translateX,
      '-moz-transform': translateX,
      '-ms-transform': translateX,
      'transform': translateX
    });

    this.currentIndex = index;
  };

  JoubelSlider.prototype.remove = function () {
    this.$slider.remove();
  };

  JoubelSlider.prototype.next = function () {
    if(this.currentIndex+1 >= this.numSlides) {
      return;
    }

    this.move(this.currentIndex+1);
  };

  JoubelSlider.prototype.previous = function () {
    this.move(this.currentIndex-1);
  };

  JoubelSlider.prototype.first = function () {
    this.move(0);
  };

  JoubelSlider.prototype.last = function () {
    this.move(this.numSlides-1);
  };

  return JoubelSlider;
})(H5P.jQuery);
;
var H5P = H5P || {};

/**
 * @module
 */
H5P.JoubelScoreBar = (function ($) {

  /* Need to use an id for the star SVG since that is the only way to reference
     SVG filters  */
  var idCounter = 0;

  /**
   * Creates a score bar
   * @class H5P.JoubelScoreBar
   * @param {number} maxScore  Maximum score
   * @param {string} [label] Makes it easier for readspeakers to identify the scorebar
   * @param {string} [helpText] Score explanation
   * @param {string} [scoreExplanationButtonLabel] Label for score explanation button
   */
  function JoubelScoreBar(maxScore, label, helpText, scoreExplanationButtonLabel) {
    var self = this;

    self.maxScore = maxScore;
    self.score = 0;
    idCounter++;

    /**
     * @const {string}
     */
    self.STAR_MARKUP = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 63.77 53.87" aria-hidden="true" focusable="false">' +
        '<title>star</title>' +
        '<filter id="h5p-joubelui-score-bar-star-inner-shadow-' + idCounter + '" x0="-50%" y0="-50%" width="200%" height="200%">' +
          '<feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"></feGaussianBlur>' +
          '<feOffset dy="2" dx="4"></feOffset>' +
          '<feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"></feComposite>' +
          '<feFlood flood-color="#ffe95c" flood-opacity="1"></feFlood>' +
          '<feComposite in2="shadowDiff" operator="in"></feComposite>' +
          '<feComposite in2="SourceGraphic" operator="over" result="firstfilter"></feComposite>' +
          '<feGaussianBlur in="firstfilter" stdDeviation="3" result="blur2"></feGaussianBlur>' +
          '<feOffset dy="-2" dx="-4"></feOffset>' +
          '<feComposite in2="firstfilter" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"></feComposite>' +
          '<feFlood flood-color="#ffe95c" flood-opacity="1"></feFlood>' +
          '<feComposite in2="shadowDiff" operator="in"></feComposite>' +
          '<feComposite in2="firstfilter" operator="over"></feComposite>' +
        '</filter>' +
        '<path class="h5p-joubelui-score-bar-star-shadow" d="M35.08,43.41V9.16H20.91v0L9.51,10.85,9,10.93C2.8,12.18,0,17,0,21.25a11.22,11.22,0,0,0,3,7.48l8.73,8.53-1.07,6.16Z"/>' +
        '<g>' +
          '<path class="h5p-joubelui-score-bar-star-border" d="M61.36,22.8,49.72,34.11l2.78,16a2.6,2.6,0,0,1,.05.64c0,.85-.37,1.6-1.33,1.6A2.74,2.74,0,0,1,49.94,52L35.58,44.41,21.22,52a2.93,2.93,0,0,1-1.28.37c-.91,0-1.33-.75-1.33-1.6,0-.21.05-.43.05-.64l2.78-16L9.8,22.8A2.57,2.57,0,0,1,9,21.25c0-1,1-1.33,1.81-1.49l16.07-2.35L34.09,2.83c.27-.59.85-1.33,1.55-1.33s1.28.69,1.55,1.33l7.21,14.57,16.07,2.35c.75.11,1.81.53,1.81,1.49A3.07,3.07,0,0,1,61.36,22.8Z"/>' +
          '<path class="h5p-joubelui-score-bar-star-fill" d="M61.36,22.8,49.72,34.11l2.78,16a2.6,2.6,0,0,1,.05.64c0,.85-.37,1.6-1.33,1.6A2.74,2.74,0,0,1,49.94,52L35.58,44.41,21.22,52a2.93,2.93,0,0,1-1.28.37c-.91,0-1.33-.75-1.33-1.6,0-.21.05-.43.05-.64l2.78-16L9.8,22.8A2.57,2.57,0,0,1,9,21.25c0-1,1-1.33,1.81-1.49l16.07-2.35L34.09,2.83c.27-.59.85-1.33,1.55-1.33s1.28.69,1.55,1.33l7.21,14.57,16.07,2.35c.75.11,1.81.53,1.81,1.49A3.07,3.07,0,0,1,61.36,22.8Z"/>' +
          '<path filter="url(#h5p-joubelui-score-bar-star-inner-shadow-' + idCounter + ')" class="h5p-joubelui-score-bar-star-fill-full-score" d="M61.36,22.8,49.72,34.11l2.78,16a2.6,2.6,0,0,1,.05.64c0,.85-.37,1.6-1.33,1.6A2.74,2.74,0,0,1,49.94,52L35.58,44.41,21.22,52a2.93,2.93,0,0,1-1.28.37c-.91,0-1.33-.75-1.33-1.6,0-.21.05-.43.05-.64l2.78-16L9.8,22.8A2.57,2.57,0,0,1,9,21.25c0-1,1-1.33,1.81-1.49l16.07-2.35L34.09,2.83c.27-.59.85-1.33,1.55-1.33s1.28.69,1.55,1.33l7.21,14.57,16.07,2.35c.75.11,1.81.53,1.81,1.49A3.07,3.07,0,0,1,61.36,22.8Z"/>' +
        '</g>' +
      '</svg>';

    /**
     * @function appendTo
     * @memberOf H5P.JoubelScoreBar#
     * @param {H5P.jQuery}  $wrapper  Dom container
     */
    self.appendTo = function ($wrapper) {
      self.$scoreBar.appendTo($wrapper);
    };

    /**
     * Create the text representation of the scorebar .
     *
     * @private
     * @return {string}
     */
    var createLabel = function (score) {
      if (!label) {
        return '';
      }

      return label.replace(':num', score).replace(':total', self.maxScore);
    };

    /**
     * Creates the html for this widget
     *
     * @method createHtml
     * @private
     */
    var createHtml = function () {
      // Container div
      self.$scoreBar = $('<div>', {
        'class': 'h5p-joubelui-score-bar',
      });

      var $visuals = $('<div>', {
        'class': 'h5p-joubelui-score-bar-visuals',
        appendTo: self.$scoreBar
      });

      // The progress bar wrapper
      self.$progressWrapper = $('<div>', {
        'class': 'h5p-joubelui-score-bar-progress-wrapper',
        appendTo: $visuals
      });

      self.$progress = $('<div>', {
        'class': 'h5p-joubelui-score-bar-progress',
        'html': createLabel(self.score),
        appendTo: self.$progressWrapper
      });

      // The star
      $('<div>', {
        'class': 'h5p-joubelui-score-bar-star',
        html: self.STAR_MARKUP
      }).appendTo($visuals);

      // The score container
      var $numerics = $('<div>', {
        'class': 'h5p-joubelui-score-numeric',
        appendTo: self.$scoreBar,
        'aria-hidden': true
      });

      // The current score
      self.$scoreCounter = $('<span>', {
        'class': 'h5p-joubelui-score-number h5p-joubelui-score-number-counter',
        text: 0,
        appendTo: $numerics
      });

      // The separator
      $('<span>', {
        'class': 'h5p-joubelui-score-number-separator',
        text: '/',
        appendTo: $numerics
      });

      // Max score
      self.$maxScore = $('<span>', {
        'class': 'h5p-joubelui-score-number h5p-joubelui-score-max',
        text: self.maxScore,
        appendTo: $numerics
      });

      if (helpText) {
        H5P.JoubelUI.createTip(helpText, {
          tipLabel: scoreExplanationButtonLabel ? scoreExplanationButtonLabel : helpText,
          helpIcon: true
        }).appendTo(self.$scoreBar);
        self.$scoreBar.addClass('h5p-score-bar-has-help');
      }
    };

    /**
     * Set the current score
     * @method setScore
     * @memberOf H5P.JoubelScoreBar#
     * @param  {number} score
     */
    self.setScore = function (score) {
      // Do nothing if score hasn't changed
      if (score === self.score) {
        return;
      }
      self.score = score > self.maxScore ? self.maxScore : score;
      self.updateVisuals();
    };

    /**
     * Increment score
     * @method incrementScore
     * @memberOf H5P.JoubelScoreBar#
     * @param  {number=}        incrementBy Optional parameter, defaults to 1
     */
    self.incrementScore = function (incrementBy) {
      self.setScore(self.score + (incrementBy || 1));
    };

    /**
     * Set the max score
     * @method setMaxScore
     * @memberOf H5P.JoubelScoreBar#
     * @param  {number}    maxScore The max score
     */
    self.setMaxScore = function (maxScore) {
      self.maxScore = maxScore;
    };

    /**
     * Updates the progressbar visuals
     * @memberOf H5P.JoubelScoreBar#
     * @method updateVisuals
     */
    self.updateVisuals = function () {
      self.$progress.html(createLabel(self.score));
      self.$scoreCounter.text(self.score);
      self.$maxScore.text(self.maxScore);

      setTimeout(function () {
        // Start the progressbar animation
        self.$progress.css({
          width: ((self.score / self.maxScore) * 100) + '%'
        });

        H5P.Transition.onTransitionEnd(self.$progress, function () {
          // If fullscore fill the star and start the animation
          self.$scoreBar.toggleClass('h5p-joubelui-score-bar-full-score', self.score === self.maxScore);
          self.$scoreBar.toggleClass('h5p-joubelui-score-bar-animation-active', self.score === self.maxScore);

          // Only allow the star animation to run once
          self.$scoreBar.one("animationend", function() {
            self.$scoreBar.removeClass("h5p-joubelui-score-bar-animation-active");
          });
        }, 600);
      }, 300);
    };

    /**
     * Removes all classes
     * @method reset
     */
    self.reset = function () {
      self.$scoreBar.removeClass('h5p-joubelui-score-bar-full-score');
    };

    createHtml();
  }

  return JoubelScoreBar;
})(H5P.jQuery);
;
var H5P = H5P || {};

H5P.JoubelProgressbar = (function ($) {

  /**
   * Joubel progressbar class
   * @method JoubelProgressbar
   * @constructor
   * @param  {number}          steps Number of steps
   * @param {Object} [options] Additional options
   * @param {boolean} [options.disableAria] Disable readspeaker assistance
   * @param {string} [options.progressText] A progress text for describing
   *  current progress out of total progress for readspeakers.
   *  e.g. "Slide :num of :total"
   */
  function JoubelProgressbar(steps, options) {
    H5P.EventDispatcher.call(this);
    var self = this;
    this.options = $.extend({
      progressText: 'Slide :num of :total'
    }, options);
    this.currentStep = 0;
    this.steps = steps;

    this.$progressbar = $('<div>', {
      'class': 'h5p-joubelui-progressbar'
    });
    this.$background = $('<div>', {
      'class': 'h5p-joubelui-progressbar-background'
    }).appendTo(this.$progressbar);
  }

  JoubelProgressbar.prototype = Object.create(H5P.EventDispatcher.prototype);
  JoubelProgressbar.prototype.constructor = JoubelProgressbar;

  JoubelProgressbar.prototype.updateAria = function () {
    var self = this;
    if (this.options.disableAria) {
      return;
    }

    if (!this.$currentStatus) {
      this.$currentStatus = $('<div>', {
        'class': 'h5p-joubelui-progressbar-slide-status-text',
        'aria-live': 'assertive'
      }).appendTo(this.$progressbar);
    }
    var interpolatedProgressText = self.options.progressText
      .replace(':num', self.currentStep)
      .replace(':total', self.steps);
    this.$currentStatus.html(interpolatedProgressText);
  };

  /**
   * Appends to a container
   * @method appendTo
   * @param  {H5P.jquery} $container
   */
  JoubelProgressbar.prototype.appendTo = function ($container) {
    this.$progressbar.appendTo($container);
  };

  /**
   * Update progress
   * @method setProgress
   * @param  {number}    step
   */
  JoubelProgressbar.prototype.setProgress = function (step) {
    // Check for valid value:
    if (step > this.steps || step < 0) {
      return;
    }
    this.currentStep = step;
    this.$background.css({
      width: ((this.currentStep/this.steps)*100) + '%'
    });

    this.updateAria();
  };

  /**
   * Increment progress with 1
   * @method next
   */
  JoubelProgressbar.prototype.next = function () {
    this.setProgress(this.currentStep+1);
  };

  /**
   * Reset progressbar
   * @method reset
   */
  JoubelProgressbar.prototype.reset = function () {
    this.setProgress(0);
  };

  /**
   * Check if last step is reached
   * @method isLastStep
   * @return {Boolean}
   */
  JoubelProgressbar.prototype.isLastStep = function () {
    return this.steps === this.currentStep;
  };

  return JoubelProgressbar;
})(H5P.jQuery);
;
var H5P = H5P || {};

/**
 * H5P Joubel UI library.
 *
 * This is a utility library, which does not implement attach. I.e, it has to bee actively used by
 * other libraries
 * @module
 */
H5P.JoubelUI = (function ($) {

  /**
   * The internal object to return
   * @class H5P.JoubelUI
   * @static
   */
  function JoubelUI() {}

  /* Public static functions */

  /**
   * Create a tip icon
   * @method H5P.JoubelUI.createTip
   * @param  {string}  text   The textual tip
   * @param  {Object}  params Parameters
   * @return {H5P.JoubelTip}
   */
  JoubelUI.createTip = function (text, params) {
    return new H5P.JoubelTip(text, params);
  };

  /**
   * Create message dialog
   * @method H5P.JoubelUI.createMessageDialog
   * @param  {H5P.jQuery}               $container The dom container
   * @param  {string}                   message    The message
   * @return {H5P.JoubelMessageDialog}
   */
  JoubelUI.createMessageDialog = function ($container, message) {
    return new H5P.JoubelMessageDialog($container, message);
  };

  /**
   * Create help text dialog
   * @method H5P.JoubelUI.createHelpTextDialog
   * @param  {string}             header  The textual header
   * @param  {string}             message The textual message
   * @param  {string}             closeButtonTitle The title for the close button
   * @return {H5P.JoubelHelpTextDialog}
   */
  JoubelUI.createHelpTextDialog = function (header, message, closeButtonTitle) {
    return new H5P.JoubelHelpTextDialog(header, message, closeButtonTitle);
  };

  /**
   * Create progress circle
   * @method H5P.JoubelUI.createProgressCircle
   * @param  {number}             number          The progress (0 to 100)
   * @param  {string}             progressColor   The progress color in hex value
   * @param  {string}             fillColor       The fill color in hex value
   * @param  {string}             backgroundColor The background color in hex value
   * @return {H5P.JoubelProgressCircle}
   */
  JoubelUI.createProgressCircle = function (number, progressColor, fillColor, backgroundColor) {
    return new H5P.JoubelProgressCircle(number, progressColor, fillColor, backgroundColor);
  };

  /**
   * Create throbber for loading
   * @method H5P.JoubelUI.createThrobber
   * @return {H5P.JoubelThrobber}
   */
  JoubelUI.createThrobber = function () {
    return new H5P.JoubelThrobber();
  };

  /**
   * Create simple rounded button
   * @method H5P.JoubelUI.createSimpleRoundedButton
   * @param  {string}                  text The button label
   * @return {H5P.SimpleRoundedButton}
   */
  JoubelUI.createSimpleRoundedButton = function (text) {
    return new H5P.SimpleRoundedButton(text);
  };

  /**
   * Create Slider
   * @method H5P.JoubelUI.createSlider
   * @param  {Object} [params] Parameters
   * @return {H5P.JoubelSlider}
   */
  JoubelUI.createSlider = function (params) {
    return new H5P.JoubelSlider(params);
  };

  /**
   * Create Score Bar
   * @method H5P.JoubelUI.createScoreBar
   * @param  {number=}       maxScore The maximum score
   * @param {string} [label] Makes it easier for readspeakers to identify the scorebar
   * @return {H5P.JoubelScoreBar}
   */
  JoubelUI.createScoreBar = function (maxScore, label, helpText, scoreExplanationButtonLabel) {
    return new H5P.JoubelScoreBar(maxScore, label, helpText, scoreExplanationButtonLabel);
  };

  /**
   * Create Progressbar
   * @method H5P.JoubelUI.createProgressbar
   * @param  {number=}       numSteps The total numer of steps
   * @param {Object} [options] Additional options
   * @param {boolean} [options.disableAria] Disable readspeaker assistance
   * @param {string} [options.progressText] A progress text for describing
   *  current progress out of total progress for readspeakers.
   *  e.g. "Slide :num of :total"
   * @return {H5P.JoubelProgressbar}
   */
  JoubelUI.createProgressbar = function (numSteps, options) {
    return new H5P.JoubelProgressbar(numSteps, options);
  };

  /**
   * Create standard Joubel button
   *
   * @method H5P.JoubelUI.createButton
   * @param {object} params
   *  May hold any properties allowed by jQuery. If href is set, an A tag
   *  is used, if not a button tag is used.
   * @return {H5P.jQuery} The jquery element created
   */
  JoubelUI.createButton = function(params) {
    var type = 'button';
    if (params.href) {
      type = 'a';
    }
    else {
      params.type = 'button';
    }
    if (params.class) {
      params.class += ' h5p-joubelui-button';
    }
    else {
      params.class = 'h5p-joubelui-button';
    }
    return $('<' + type + '/>', params);
  };

  /**
   * Fix for iframe scoll bug in IOS. When focusing an element that doesn't have
   * focus support by default the iframe will scroll the parent frame so that
   * the focused element is out of view. This varies dependening on the elements
   * of the parent frame.
   */
  if (H5P.isFramed && !H5P.hasiOSiframeScrollFix &&
      /iPad|iPhone|iPod/.test(navigator.userAgent)) {
    H5P.hasiOSiframeScrollFix = true;

    // Keep track of original focus function
    var focus = HTMLElement.prototype.focus;

    // Override the original focus
    HTMLElement.prototype.focus = function () {
      // Only focus the element if it supports it natively
      if ( (this instanceof HTMLAnchorElement ||
            this instanceof HTMLInputElement ||
            this instanceof HTMLSelectElement ||
            this instanceof HTMLTextAreaElement ||
            this instanceof HTMLButtonElement ||
            this instanceof HTMLIFrameElement ||
            this instanceof HTMLAreaElement) && // HTMLAreaElement isn't supported by Safari yet.
          !this.getAttribute('role')) { // Focus breaks if a different role has been set
          // In theory this.isContentEditable should be able to recieve focus,
          // but it didn't work when tested.

        // Trigger the original focus with the proper context
        focus.call(this);
      }
    };
  }

  return JoubelUI;
})(H5P.jQuery);
;
var H5P = H5P || {};

/**
 * H5P audio module
 *
 * @external {jQuery} $ H5P.jQuery
 */
H5P.Audio = (function ($) {
  /**
  * @param {Object} params Options for this library.
  * @param {Number} id Content identifier.
  * @param {Object} extras Extras.
  * @returns {undefined}
  */
  function C(params, id, extras) {
    H5P.EventDispatcher.call(this);

    this.contentId = id;
    this.params = params;
    this.extras = extras;
    this.toggleButtonEnabled = true;

    // Retrieve previous state
    if (extras && extras.previousState !== undefined) {
      this.oldTime = extras.previousState.currentTime;
    }

    this.params = $.extend({}, {
      playerMode: 'minimalistic',
      fitToWrapper: false,
      controls: true,
      autoplay: false,
      audioNotSupported: "Your browser does not support this audio",
      playAudio: "Play audio",
      pauseAudio: "Pause audio"
    }, params);

    // Required if e.g. used in CoursePresentation as area to click on
    if (this.params.playerMode === 'transparent') {
      this.params.fitToWrapper = true;
    }

    this.on('resize', this.resize, this);
  }

  C.prototype = Object.create(H5P.EventDispatcher.prototype);
  C.prototype.constructor = C;

  /**
   * Adds a minimalistic audio player with only "play" and "pause" functionality.
   *
   * @param {jQuery} $container Container for the player.
   * @param {boolean} transparentMode true: the player is only visible when hovering over it; false: player's UI always visible
   */
  C.prototype.addMinimalAudioPlayer = function ($container, transparentMode) {
    var INNER_CONTAINER = 'h5p-audio-inner';
    var AUDIO_BUTTON = 'h5p-audio-minimal-button';
    var PLAY_BUTTON = 'h5p-audio-minimal-play';
    var PLAY_BUTTON_PAUSED = 'h5p-audio-minimal-play-paused';
    var PAUSE_BUTTON = 'h5p-audio-minimal-pause';

    var self = this;
    this.$container = $container;

    self.$inner = $('<div/>', {
      'class': INNER_CONTAINER + (transparentMode ? ' h5p-audio-transparent' : '')
    }).appendTo($container);

    var audioButton = $('<button/>', {
      'class': AUDIO_BUTTON + " " + PLAY_BUTTON,
      'aria-label': this.params.playAudio
    }).appendTo(self.$inner)
      .click( function () {
        if (!self.isEnabledToggleButton()) {
          return;
        }

        // Prevent ARIA from playing over audio on click
        this.setAttribute('aria-hidden', 'true');

        if (self.audio.paused) {
          self.play();
        }
        else {
          self.pause();
        }
      })
      .on('focusout', function () {
        // Restore ARIA, required when playing longer audio and tabbing out and back in
        this.setAttribute('aria-hidden', 'false');
      });

    // Fit to wrapper
    if (this.params.fitToWrapper) {
      audioButton.css({
        'width': '100%',
        'height': '100%'
      });
    }

    //Event listeners that change the look of the player depending on events.
    self.audio.addEventListener('ended', function () {
      audioButton
        .attr('aria-hidden', false)
        .attr('aria-label', self.params.playAudio)
        .removeClass(PAUSE_BUTTON)
        .removeClass(PLAY_BUTTON_PAUSED)
        .addClass(PLAY_BUTTON);
    });

    self.audio.addEventListener('play', function () {
      audioButton
        .attr('aria-label', self.params.pauseAudio)
        .removeClass(PLAY_BUTTON)
        .removeClass(PLAY_BUTTON_PAUSED)
        .addClass(PAUSE_BUTTON);
    });

    self.audio.addEventListener('pause', function () {
      audioButton
        .attr('aria-hidden', false)
        .attr('aria-label', self.params.playAudio)
        .removeClass(PAUSE_BUTTON)
        .addClass(PLAY_BUTTON_PAUSED);
    });

    this.$audioButton = audioButton;
    // Scale icon to container
    self.resize();
  };

  /**
   * Resizes the audio player icon when the wrapper is resized.
   */
  C.prototype.resize = function () {
    // Find the smallest value of height and width, and use it to choose the font size.
    if (this.params.fitToWrapper && this.$container && this.$container.width()) {
      var w = this.$container.width();
      var h = this.$container.height();
      if (w < h) {
        this.$audioButton.css({'font-size': w / 2 + 'px'});
      }
      else {
        this.$audioButton.css({'font-size': h / 2 + 'px'});
      }
    }
  };

  return C;
})(H5P.jQuery);

/**
 * Wipe out the content of the wrapper and put our HTML in it.
 *
 * @param {jQuery} $wrapper Our poor container.
 */
H5P.Audio.prototype.attach = function ($wrapper) {
  const self = this;
  $wrapper.addClass('h5p-audio-wrapper');

  // Check if browser supports audio.
  var audio = document.createElement('audio');
  if (audio.canPlayType === undefined) {
    this.attachNotSupportedMessage($wrapper);
    return;
  }

  // Add supported source files.
  if (this.params.files !== undefined && this.params.files instanceof Object) {
    for (var i = 0; i < this.params.files.length; i++) {
      var file = this.params.files[i];

      if (audio.canPlayType(file.mime)) {
        var source = document.createElement('source');
        source.src = H5P.getPath(file.path, this.contentId);
        source.type = file.mime;
        audio.appendChild(source);
      }
    }
  }

  if (!audio.children.length) {
    this.attachNotSupportedMessage($wrapper);
    return;
  }

  if (this.endedCallback !== undefined) {
    audio.addEventListener('ended', this.endedCallback, false);
  }

  audio.className = 'h5p-audio';
  audio.controls = this.params.controls === undefined ? true : this.params.controls;

  // Menu removed, because it's cut off if audio is used as H5P.Question intro
  const controlsList = 'nodownload noplaybackrate';
  audio.setAttribute('controlsList', controlsList);

  audio.preload = 'auto';
  audio.style.display = 'block';

  if (this.params.fitToWrapper === undefined || this.params.fitToWrapper) {
    audio.style.width = '100%';
    if (!this.isRoot()) {
      // Only set height if this isn't a root
      audio.style.height = '100%';
    }
  }

  this.audio = audio;

  if (this.params.playerMode === 'minimalistic') {
    audio.controls = false;
    this.addMinimalAudioPlayer($wrapper, false);
  }
  else if (this.params.playerMode === 'transparent') {
    audio.controls = false;
    this.addMinimalAudioPlayer($wrapper, true);
  }
  else {
    $wrapper.html(audio);
  }

  if (audio.controls) {
    $wrapper.addClass('h5p-audio-controls');
  }

  // Set time to saved time from previous run
  if (this.oldTime) {
    this.seekTo(this.oldTime);
  }

  // Avoid autoplaying in authoring tool
  if (window.H5PEditor === undefined) {
    // Keep record of autopauses.
    // I.e: we don't wanna autoplay if the user has excplicitly paused.
    self.autoPaused = true;

    // Set up intersection observer
    new IntersectionObserver(function (entries) {
      const entry = entries[0];

      if (entry.intersectionRatio == 0) {
        if (!self.audio.paused) {
          // Audio element is hidden, pause it
          self.autoPaused = true;
          self.audio.pause();
        }
      }
      else if (self.params.autoplay && self.autoPaused) {
        // Audio element is visible. Autoplay if autoplay is enabled and it was
        // not explicitly paused by a user
        self.autoPaused = false;
        self.audio.play();
      }
    }, {
      root: document.documentElement,
      threshold: [0, 1] // Get events when it is shown and hidden
    }).observe($wrapper.get(0));
  }
};

/**
 * Attaches not supported message.
 *
 * @param {jQuery} $wrapper Our dear container.
 */
H5P.Audio.prototype.attachNotSupportedMessage = function ($wrapper) {
  $wrapper.addClass('h5p-audio-not-supported');
  $wrapper.html(
    '<div class="h5p-audio-inner">' +
      '<div class="h5p-audio-not-supported-icon"><span/></div>' +
      '<span>' + this.params.audioNotSupported + '</span>' +
    '</div>'
  );

  if (this.endedCallback !== undefined) {
    this.endedCallback();
  }
}

/**
 * Stop the audio. TODO: Rename to pause?
 *
 * @returns {undefined}
 */
H5P.Audio.prototype.stop = function () {
  if (this.flowplayer !== undefined) {
    this.flowplayer.stop().close().unload();
  }
  if (this.audio !== undefined) {
    this.audio.pause();
  }
};

/**
 * Play
 */
H5P.Audio.prototype.play = function () {
  if (this.flowplayer !== undefined) {
    this.flowplayer.play();
  }
  if (this.audio !== undefined) {
    this.audio.play();
  }
};

/**
 * @public
 * Pauses the audio.
 */
H5P.Audio.prototype.pause = function () {
  if (this.audio !== undefined) {
    this.audio.pause();
  }
};

/**
 * @public
 * Seek to audio position.
 *
 * @param {number} seekTo Time to seek to in seconds.
 */
H5P.Audio.prototype.seekTo = function (seekTo) {
  if (this.audio !== undefined) {
    this.audio.currentTime = seekTo;
  }
};

/**
 * @public
 * Get current state for resetting it later.
 *
 * @returns {object} Current state.
 */
H5P.Audio.prototype.getCurrentState = function () {
  if (this.audio !== undefined) {
    const currentTime = this.audio.ended ? 0 : this.audio.currentTime;
    return {
      currentTime: currentTime
    };
  }
};

/**
 * @public
 * Disable button.
 * Not using disabled attribute to block button activation, because it will
 * implicitly set tabindex = -1 and confuse ChromeVox navigation. Clicks handled
 * using "pointer-events: none" in CSS.
 */
H5P.Audio.prototype.disableToggleButton = function () {
  this.toggleButtonEnabled = false;
  if (this.$audioButton) {
    this.$audioButton.addClass(H5P.Audio.BUTTON_DISABLED);
  }
};

/**
 * @public
 * Enable button.
 */
H5P.Audio.prototype.enableToggleButton = function () {
  this.toggleButtonEnabled = true;
  if (this.$audioButton) {
    this.$audioButton.removeClass(H5P.Audio.BUTTON_DISABLED);
  }
};

/**
 * @public
 * Check if button is enabled.
 * @return {boolean} True, if button is enabled. Else false.
 */
H5P.Audio.prototype.isEnabledToggleButton = function () {
  return this.toggleButtonEnabled;
};

/** @constant {string} */
H5P.Audio.BUTTON_DISABLED = 'h5p-audio-disabled';
;
(()=>{"use strict";const t=H5P.jQuery;class s{constructor(s,e,a,r,i={},d){return this.card=s,this.params=e||{},this.id=a,this.contentId=r,this.callbacks=i,this.$cardWrapper=t("<div>",{class:"h5p-dialogcards-cardwrap",role:"group",tabindex:"-1"}),this.$cardWrapper.addClass("h5p-dialogcards-mode-"+this.params.mode),"repetition"!==this.params.mode&&this.$cardWrapper.attr("aria-labelledby","h5p-dialogcards-progress-"+d),this.$cardHolder=t("<div>",{class:"h5p-dialogcards-cardholder"}).appendTo(this.$cardWrapper),this.createCardContent(s).appendTo(this.$cardHolder),this}createCardContent(s){const e=t("<div>",{class:"h5p-dialogcards-card-content"});this.createCardImage(s).appendTo(e);const a=t("<div>",{class:"h5p-dialogcards-card-text-wrapper"}).appendTo(e),r=t("<div>",{class:"h5p-dialogcards-card-text-inner"}).appendTo(a),i=t("<div>",{class:"h5p-dialogcards-card-text-inner-content"}).appendTo(r);this.createCardAudio(s).appendTo(i);const d=t("<div>",{class:"h5p-dialogcards-card-text"}).appendTo(i);return this.$cardTextArea=t("<div>",{class:"h5p-dialogcards-card-text-area",tabindex:"-1",html:s.text}).appendTo(d),s.text&&s.text.length||d.addClass("hide"),this.createCardFooter().appendTo(a),e}createCardImage(s){this.$image;const e=t("<div>",{class:"h5p-dialogcards-image-wrapper"});return void 0!==s.image?(this.image=s.image,this.$image=t('<img class="h5p-dialogcards-image" src="'+H5P.getPath(s.image.path,this.contentId)+'"/>'),s.imageAltText&&this.$image.attr("alt",s.imageAltText)):this.$image=t('<div class="h5p-dialogcards-image"></div>'),this.$image.appendTo(e),e}createCardAudio(s){if(this.audio,this.$audioWrapper=t("<div>",{class:"h5p-dialogcards-audio-wrapper"}),void 0!==s.audio){const t={files:s.audio,audioNotSupported:this.params.audioNotSupported};this.audio=new H5P.Audio(t,this.contentId),this.audio.attach(this.$audioWrapper),this.audio.audio&&this.audio.audio.preload&&(this.audio.audio.preload="none")}else this.$audioWrapper.addClass("hide");return this.$audioWrapper}createCardFooter(){const s=t("<div>",{class:"h5p-dialogcards-card-footer"});let e="h5p-dialogcards-button-hidden",a="-1";return"repetition"===this.params.mode&&(e="",this.params.behaviour.quickProgression&&(e="h5p-dialogcards-quick-progression",a="0")),this.$buttonTurn=H5P.JoubelUI.createButton({class:"h5p-dialogcards-turn",html:this.params.answer}).appendTo(s),"repetition"===this.params.mode&&(this.$buttonShowSummary=H5P.JoubelUI.createButton({class:"h5p-dialogcards-show-summary h5p-dialogcards-button-gone",html:this.params.showSummary}).appendTo(s),this.$buttonIncorrect=H5P.JoubelUI.createButton({class:"h5p-dialogcards-answer-button",html:this.params.incorrectAnswer}).addClass("incorrect").addClass(e).attr("tabindex",a).appendTo(s),this.$buttonCorrect=H5P.JoubelUI.createButton({class:"h5p-dialogcards-answer-button",html:this.params.correctAnswer}).addClass("correct").addClass(e).attr("tabindex",a).appendTo(s)),s}createButtonListeners(){this.$buttonTurn.unbind("click").click((()=>{this.turnCard()})),"repetition"===this.params.mode&&(this.$buttonIncorrect.unbind("click").click((t=>{t.target.classList.contains("h5p-dialogcards-quick-progression")&&this.callbacks.onNextCard({cardId:this.id,result:!1})})),this.$buttonCorrect.unbind("click").click((t=>{t.target.classList.contains("h5p-dialogcards-quick-progression")&&this.callbacks.onNextCard({cardId:this.id,result:!0})})))}showSummaryButton(t){this.getDOM().find(".h5p-dialogcards-answer-button").addClass("h5p-dialogcards-button-hidden").attr("tabindex","-1"),this.$buttonTurn.addClass("h5p-dialogcards-button-gone"),this.$buttonShowSummary.click((()=>t())).removeClass("h5p-dialogcards-button-gone").focus()}hideSummaryButton(){"normal"!==this.params.mode&&(this.getDOM().find(".h5p-dialogcards-answer-button").removeClass("h5p-dialogcards-button-hidden").attr("tabindex","0"),this.$buttonTurn.removeClass("h5p-dialogcards-button-gone"),this.$buttonShowSummary.addClass("h5p-dialogcards-button-gone").off("click"))}turnCard(){const t=this.getDOM(),s=t.find(".h5p-dialogcards-card-content"),e=t.find(".h5p-dialogcards-cardholder").addClass("h5p-dialogcards-collapse");s.find(".joubel-tip-container").remove();const a=s.hasClass("h5p-dialogcards-turned");s.toggleClass("h5p-dialogcards-turned",!a),setTimeout((()=>{if(e.removeClass("h5p-dialogcards-collapse"),this.changeText(a?this.getText():this.getAnswer()),a?e.find(".h5p-audio-inner").removeClass("hide"):this.removeAudio(e),"repetition"===this.params.mode&&!this.params.behaviour.quickProgression){const s=t.find(".h5p-dialogcards-answer-button");!1===s.hasClass("h5p-dialogcards-quick-progression")&&s.addClass("h5p-dialogcards-quick-progression").attr("tabindex",0)}setTimeout((()=>{this.addTipToCard(s,a?"front":"back"),"function"==typeof this.callbacks.onCardTurned&&this.callbacks.onCardTurned(a)}),200),this.resizeOverflowingText(),this.$cardTextArea.focus()}),200)}changeText(t){this.$cardTextArea.html(t),this.$cardTextArea.toggleClass("hide",!t||!t.length)}setProgressText(t,s){if("repetition"!==this.params.mode)return;const e=this.params.progressText.replace("@card",t.toString()).replace("@total",s.toString());this.$cardWrapper.attr("aria-label",e)}resizeOverflowingText(){if(!this.params.behaviour.scaleTextNotCard)return;const t=this.getDOM().find(".h5p-dialogcards-card-text"),s=t.children();this.resizeTextToFitContainer(t,s)}resizeTextToFitContainer(t,e){e.css("font-size","");const a=t.get(0).getBoundingClientRect().height;let r=e.get(0).getBoundingClientRect().height;const i=parseFloat(t.css("font-size"));let d=parseFloat(e.css("font-size"));const o=this.getDOM().closest(".h5p-container"),n=parseFloat(o.css("font-size"));if(r>a){let t=!0;for(;t;){if(d-=s.SCALEINTERVAL,d<s.MINSCALE){t=!1;break}e.css("font-size",d/i+"em"),r=e.get(0).getBoundingClientRect().height,r<=a&&(t=!1)}}else{let t=!0;for(;t;){if(d+=s.SCALEINTERVAL,d>n){t=!1;break}e.css("font-size",d/i+"em"),r=e.get(0).getBoundingClientRect().height,r>=a&&(t=!1,d-=s.SCALEINTERVAL,e.css("font-size",d/i+"em"))}}}addTipToCard(t,s,e){"back"!==s&&(s="front"),void 0===e&&(e=this.id),t.find(".joubel-tip-container").remove();const a=this.card.tips;if(void 0!==a&&void 0!==a[s]){const e=a[s].trim();e.length&&t.find(".h5p-dialogcards-card-text-wrapper .h5p-dialogcards-card-text-inner").after(H5P.JoubelUI.createTip(e,{tipLabel:this.params.tipButtonLabel}))}}setCardFocus(t){if(!0===t)this.$cardTextArea.focus();else{const t=this.getDOM();t.one("transitionend",(()=>{t.focus()}))}}stopAudio(){if(!this.audio||!this.audio.audio)return;const t=this.audio.audio.duration;t>0&&t<Number.MAX_SAFE_INTEGER&&this.audio.seekTo(t),this.audio.audio.load&&setTimeout((()=>{this.audio.audio.load()}),100)}removeAudio(){this.stopAudio(),this.getDOM().find(".h5p-audio-inner").addClass("hide")}getDOM(){return this.$cardWrapper}getText(){return this.card.text}getAnswer(){return this.card.answer}getImage(){return this.$image}getImageSize(){return this.image?{width:this.image.width,height:this.image.height}:this.image}getAudio(){return this.$audioWrapper}reset(){const t=this.getDOM();t.removeClass("h5p-dialogcards-previous"),t.removeClass("h5p-dialogcards-current"),this.changeText(this.getText());const s=t.find(".h5p-dialogcards-card-content");s.removeClass("h5p-dialogcards-turned"),this.addTipToCard(s,"front",this.id),this.params.behaviour.quickProgression||t.find(".h5p-dialogcards-answer-button").removeClass("h5p-dialogcards-quick-progression"),this.hideSummaryButton()}}s.SCALEINTERVAL=.2,s.MAXSCALE=16,s.MINSCALE=4;const e=s;const a=class{constructor(t,s,e,a){return this.params=t,this.contentId=s,this.callbacks=e,this.idCounter=a,this.cards=[],this.params.dialogs.forEach(((t,s)=>{t.id=s,this.cards.push(s)})),this}getCard(t){if(!(t<0||t>this.cards.length))return"number"==typeof this.cards[t]&&this.loadCard(t),this.cards[t]}getCardIds(){return this.cards.map(((t,s)=>s))}loadCard(t){t<0||t>this.cards.length||"number"==typeof this.cards[t]&&(this.cards[t]=new e(this.params.dialogs[t],this.params,t,this.contentId,this.callbacks,this.idCounter))}};const r=class{constructor(t=[]){return this.cards=t.filter(((s,e)=>t.indexOf(s)>=e)),this}getCards(){return this.cards}peek(t,s=1){return s=Math.max(0,s),"top"===t&&(t=0),"bottom"===t&&(t=this.cards.length-s),t<0||t>this.cards.length-1?[]:this.cards.slice(t,t+s)}add(t,s="top"){"number"==typeof t&&(t=[t]),t.forEach((e=>{-1===this.cards.indexOf(e)&&("top"===s?s=0:"bottom"===s?s=this.cards.length:"random"===s&&(s=Math.floor(Math.random()*this.cards.length)),this.cards.splice(s,0,...t))}))}push(t){this.add(t,"top")}pull(t=1,s="top"){return t=Math.max(1,Math.min(t,this.cards.length)),"top"===s&&(s=0),"bottom"===s&&(s=-t),s=Math.max(0,Math.min(s,this.cards.length-1)),this.cards.splice(s,t)}remove(t){"number"==typeof t&&(t=[t]),t.forEach((t=>{const s=this.cards.indexOf(t);s>-1&&this.cards.splice(s,1)}))}shuffle(){for(let t=this.cards.length-1;t>0;t--){const s=Math.floor(Math.random()*(t+1));[this.cards[t],this.cards[s]]=[this.cards[s],this.cards[t]]}return this.cards}contains(t){return-1!==this.cards.indexOf(t)}length(){return this.cards.length}};const i=class{constructor(t,s,e,r){return this.params=t,this.cardPool=new a(t,s,e,r),this.reset(t.cardPiles),this}createSelection(){let t=[];if("repetition"===this.params.mode)t=this.createSelectionRepetition();else t=this.cardPool.getCardIds();return t}createPiles(t){if(t)return void(this.cardPiles=t.map((t=>new r(t.cards))));this.cardPiles=[];const s=this.cardPool.getCardIds();switch(this.params.mode){case"repetition":for(let t=0;t<this.params.behaviour.maxProficiency+1;t++)0===t?this.cardPiles.push(new r(s)):this.cardPiles.push(new r);break;case"normal":this.cardPiles.push(new r(s))}}updatePiles(t){return t.forEach((t=>{const s=this.find(t.cardId);if(-1===s)return;let e=!0===t.result?s+1:0;e=Math.max(0,Math.min(e,this.cardPiles.length-1)),this.cardPiles[s].remove(t.cardId),this.cardPiles[e].add(t.cardId,"bottom")})),this.getPileSizes()}createSelectionRepetition(){let t=[],s=null;for(let e=0;e<this.cardPiles.length-1;e++){const a=this.cardPiles[e].length();if(null===s&&0===a)continue;null===s&&(s=e);const r=Math.ceil(1*a/(1+e-s)),i=this.cardPiles[e].peek(0,r);t=t.concat(...i)}return t=this.shuffle(t),t}shuffle(t){const s=t.slice();for(let t=s.length-1;t>0;t--){const e=Math.floor(Math.random()*(t+1));[s[t],s[e]]=[s[e],s[t]]}return s}find(t){let s=-1;return this.cardPiles.forEach(((e,a)=>{if(-1!==s)return s;e.contains(t)&&(s=a)})),s}reset(t){this.createPiles(t)}getCard(t){return this.cardPool.getCard(t)}getSize(){return this.cardPool.getCardIds().length}getPiles(){return this.cardPiles}getPileSizes(){return this.cardPiles.map((t=>t.length()))}};const d=class{constructor(t,s){this.params=t,this.callbacks=s,this.currentCallback=s.nextRound,this.fields=[],this.container=document.createElement("div"),this.container.classList.add("h5p-dialogcards-summary-screen");const e=this.createContainerDOM(t.summary);this.fields.round=e.getElementsByClassName("h5p-dialogcards-summary-subheader")[0],this.fields["h5p-dialogcards-round-cards-right"]=this.addTableRow(e,{category:this.params.summaryCardsRight,symbol:"h5p-dialogcards-check"}),this.fields["h5p-dialogcards-round-cards-wrong"]=this.addTableRow(e,{category:this.params.summaryCardsWrong,symbol:"h5p-dialogcards-times"}),this.fields["h5p-dialogcards-round-cards-not-shown"]=this.addTableRow(e,{category:this.params.summaryCardsNotShown});const a=this.createContainerDOM(t.summaryOverallScore);this.fields["h5p-dialogcards-overall-cards-completed"]=this.addTableRow(a,{category:this.params.summaryCardsCompleted,symbol:"h5p-dialogcards-check"}),this.fields["h5p-dialogcards-overall-completed-rounds"]=this.addTableRow(a,{category:this.params.summaryCompletedRounds,symbol:""});const r=document.createElement("div");r.classList.add("h5p-dialogcards-summary-message"),this.fields.message=r;const i=H5P.JoubelUI.createButton({class:"h5p-dialogcards-buttonNextRound",title:this.params.nextRound.replace("@round",2),html:this.params.nextRound.replace("@round",2)}).click(this.currentCallback).get(0);this.fields.button=i;const d=H5P.JoubelUI.createButton({class:"h5p-dialogcards-button-restart",title:this.params.startOver,html:this.params.startOver}).get(0),o=this.createConfirmationDialog({l10n:this.params.confirmStartingOver,instance:this},(()=>{setTimeout((()=>{this.callbacks.retry()}),100)}));d.addEventListener("click",(t=>{o.show(t.target.offsetTop)})),this.fields.buttonStartOver=d;const n=document.createElement("div");return n.classList.add("h5p-dialogcards-summary-footer"),n.appendChild(d),n.appendChild(i),this.container.appendChild(e),this.container.appendChild(a),this.container.appendChild(r),this.container.appendChild(n),this.hide(),this}getDOM(){return this.container}createContainerDOM(t,s=""){const e=document.createElement("div");e.classList.add("h5p-dialogcards-summary-container");const a=document.createElement("div");a.classList.add("h5p-dialogcards-summary-header"),a.innerHTML=t,e.appendChild(a);const r=document.createElement("div");r.classList.add("h5p-dialogcards-summary-subheader"),r.innerHTML=s,e.appendChild(r);const i=document.createElement("table");return i.classList.add("h5p-dialogcards-summary-table"),e.appendChild(i),e}addTableRow(t,s){const e=t.getElementsByClassName("h5p-dialogcards-summary-table")[0],a=document.createElement("tr"),r=document.createElement("td");r.classList.add("h5p-dialogcards-summary-table-row-category"),r.innerHTML=s.category,a.appendChild(r);const i=document.createElement("td");i.classList.add("h5p-dialogcards-summary-table-row-symbol"),void 0!==s.symbol&&""!==s.symbol&&i.classList.add(s.symbol),a.appendChild(i);const d=document.createElement("td");return d.classList.add("h5p-dialogcards-summary-table-row-score"),a.appendChild(d),e.appendChild(a),d}update({done:t=!1,round:s,message:e,results:a=[]}={}){!0===t?(this.fields.buttonStartOver.classList.add("h5p-dialogcards-button-gone"),this.params.behaviour.enableRetry?(this.fields.button.classList.remove("h5p-dialogcards-button-next-round"),this.fields.button.classList.add("h5p-dialogcards-button-restart"),this.fields.button.innerHTML=this.params.retry,this.fields.button.title=this.params.retry,this.currentCallback=this.callbacks.retry):this.fields.button.classList.add("h5p-dialogcards-button-gone")):(this.fields.buttonStartOver.classList.remove("h5p-dialogcards-button-gone"),this.fields.button.classList.add("h5p-dialogcards-button-next-round"),this.fields.button.classList.remove("h5p-dialogcards-button-restart"),this.fields.button.innerHTML=this.params.nextRound,this.fields.button.title=this.params.nextRound,this.currentCallback=this.callbacks.nextRound),H5P.jQuery(this.fields.button).unbind("click").click(this.currentCallback),this.fields.round.innerHTML=this.params.round.replace("@round",s),t||void 0===s||(this.fields.button.innerHTML=this.params.nextRound.replace("@round",s+1),this.fields.button.title=this.params.nextRound.replace("@round",s+1)),t&&void 0!==e&&""!==e?(this.fields.message.classList.remove("h5p-dialogcards-gone"),this.fields.message.innerHTML=e):this.fields.message.classList.add("h5p-dialogcards-gone"),a.forEach((t=>{let s=void 0!==t.score.value?t.score.value:"";void 0!==t.score.max&&(s=`${s}&nbsp;<span class="h5p-dialogcards-summary-table-row-score-divider">/</span>&nbsp;${t.score.max}`),this.fields[t.field].innerHTML=s}))}show(){this.container.classList.remove("h5p-dialogcards-gone"),setTimeout((()=>{this.fields.button.focus()}),0)}hide(){this.container.classList.add("h5p-dialogcards-gone")}createConfirmationDialog(t,s){t=t||{};var e=new H5P.ConfirmationDialog({instance:t.instance,headerText:t.l10n.header,dialogText:t.l10n.body,cancelText:t.l10n.cancelLabel,confirmText:t.l10n.confirmLabel});return e.on("confirmed",(()=>{s()})),e.appendTo(this.getContainer()),e}getContainer(){const t=H5P.jQuery('[data-content-id="'+self.contentId+'"].h5p-content'),s=t.parents(".h5p-container");let e;return e=0!==s.length?s.last():0!==t.length?t:H5P.jQuery(document.body),e.get(0)}},o=H5P.jQuery,n=H5P.JoubelUI;class h extends H5P.EventDispatcher{constructor(t,s,e){super(),this.idCounter=h.idCounter++,this.contentId=this.id=s,this.previousState=e.previousState||{},this.contentData=e||{},this.params=o.extend({title:"",mode:"normal",description:"Sit in pairs and make up sentences where you include the expressions below.<br/>Example: I should have said yes, HOWEVER I kept my mouth shut.",next:"Next",prev:"Previous",retry:"Retry",answer:"Turn",correctAnswer:"I got it right!",incorrectAnswer:"I got it wrong",round:"Round @round",cardsLeft:"Cards left: @number",nextRound:"Proceed to round @round",startOver:"Start over",showSummary:"Next",summary:"Summary",summaryCardsRight:"Cards you got right:",summaryCardsWrong:"Cards you got wrong:",summaryCardsNotShown:"Cards in pool not shown:",summaryOverallScore:"Overall Score",summaryCardsCompleted:"Cards you have completed learning:",summaryCompletedRounds:"Completed rounds:",summaryAllDone:"Well done! You have mastered all @cards cards by getting them correct @max times!",progressText:"Card @card of @total",cardFrontLabel:"Card front",cardBackLabel:"Card back",tipButtonLabel:"Show tip",audioNotSupported:"Your browser does not support this audio",confirmStartingOver:{header:"Start over?",body:"All progress will be lost. Are you sure you want to start over?",cancelLabel:"Cancel",confirmLabel:"Start over"},dialogs:[{text:"Horse",answer:"Hest"},{text:"Cow",answer:"Ku"}],behaviour:{enableRetry:!0,disableBackwardsNavigation:!1,scaleTextNotCard:!1,randomCards:!1,maxProficiency:5,quickProgression:!1}},t),this.cards=[],this.currentCardId=0,this.round=0,this.results=this.previousState.results||[],this.attach=t=>{this.$inner=t.addClass("h5p-dialogcards"),this.params.behaviour.scaleTextNotCard&&t.addClass("h5p-text-scaling");const s={mode:this.params.mode,dialogs:this.params.dialogs,audioNotSupported:this.params.audioNotSupported,answer:this.params.answer,showSummary:this.params.showSummary,incorrectAnswer:this.params.incorrectAnswer,correctAnswer:this.params.correctAnswer,progressText:this.params.progressText,tipButtonLabel:this.params.tipButtonLabel,behaviour:{scaleTextNotCard:this.params.behaviour.scaleTextNotCard,maxProficiency:this.params.behaviour.maxProficiency,quickProgression:this.params.behaviour.quickProgression},cardPiles:this.previousState.cardPiles};this.cardManager=new i(s,this.id,{onCardTurned:this.handleCardTurned,onNextCard:this.nextCard},this.idCounter),this.createDOM(0===this.round),void 0!==this.previousState.currentCardId&&(this.gotoCard(this.previousState.currentCardId),"repetition"===this.params.mode&&this.results.length===this.cardIds.length&&this.showSummary(!0)),this.updateNavigation(),this.trigger("resize")},this.createDOM=t=>{if(this.cardIds=t&&this.previousState.cardIds?this.previousState.cardIds:this.cardManager.createSelection(),this.cardPoolSize=this.cardPoolSize||this.cardManager.getSize(),!0===t){const t=o("<div>"+this.params.title+"</div>").text().trim();this.$header=o((t?'<div class="h5p-dialogcards-title"><div class="h5p-dialogcards-title-inner">'+this.params.title+"</div></div>":"")+'<div class="h5p-dialogcards-description">'+this.params.description+"</div>"),this.summaryScreen=new d(this.params,{nextRound:this.nextRound,retry:this.restartRepetition})}!0===t?this.$cardwrapperSet=this.initCards(this.cardIds):(this.$cardwrapperSet.detach(),this.$cardwrapperSet=this.initCards(this.cardIds),this.$cardSideAnnouncer.before(this.$cardwrapperSet)),this.$cardwrapperSet.prepend(this.summaryScreen.getDOM()),!0===t&&(this.$cardSideAnnouncer=o("<div>",{html:this.params.cardFrontLabel,class:"h5p-dialogcards-card-side-announcer","aria-live":"polite","aria-hidden":"true"}),this.$footer=this.createFooter(),this.$mainContent=o("<div>").append(this.$header).append(this.$cardwrapperSet).append(this.$cardSideAnnouncer).append(this.$footer).appendTo(this.$inner),this.on("reset",(function(){this.reset()})),this.on("resize",this.resize),this.round=void 0!==this.previousState.round?this.previousState.round:1)},this.createFooter=()=>{const t=o("<nav>",{class:"h5p-dialogcards-footer",role:"navigation"}),s=function(t,s){o(t).append('<span class="button-tooltip">'+s+"</span>"),o(t).find(".button-tooltip").hide().fadeIn("fast")},e=function(t){o(t).find(".button-tooltip").remove()};if("normal"===this.params.mode){const a=this;this.$prev=n.createButton({class:"h5p-dialogcards-footer-button h5p-dialogcards-prev truncated","aria-label":this.params.prev}).click((()=>{this.prevCard()})).appendTo(t),this.$prev.hover((function(t){s(a.$prev,a.params.prev)}),(function(){e(a.$prev)})),this.$next=n.createButton({class:"h5p-dialogcards-footer-button h5p-dialogcards-next truncated","aria-label":this.params.next}).click((()=>{this.nextCard()})).appendTo(t),this.$next.hover((function(t){s(a.$next,a.params.next)}),(function(){e(a.$next)})),this.$retry=n.createButton({class:"h5p-dialogcards-footer-button h5p-dialogcards-retry h5p-dialogcards-disabled",html:this.params.retry}).click((()=>{this.trigger("reset")})).appendTo(t),this.$retry.hover((function(t){s(a.$retry,a.params.retry)}),(function(){e(a.$retry)})),this.$progress=o("<div>",{id:"h5p-dialogcards-progress-"+this.idCounter,class:"h5p-dialogcards-progress","aria-live":"assertive"}).appendTo(t)}else this.$round=o("<div>",{class:"h5p-dialogcards-round"}).appendTo(t),this.$progress=o("<div>",{class:"h5p-dialogcards-cards-left","aria-live":"assertive"}).appendTo(t);return t},this.updateImageSize=()=>{let t=0;const s=this.cards[this.currentCardId].getDOM().find(".h5p-dialogcards-card-content");if(this.params.dialogs.forEach((e=>{if(!e.image)return;const a=e.image.height/e.image.width*s.get(0).getBoundingClientRect().width;a>t&&(t=a)})),t>0){let s=t/parseFloat(this.$inner.css("font-size"));s>15&&(s=15),this.cards.forEach((t=>{t.getImage().parent().css("height",s+"em")}))}},this.initCards=t=>{this.cards=[],this.currentCardId=0,this.params.behaviour.randomCards&&(t=H5P.shuffleArray(t));const s=o("<div>",{class:"h5p-dialogcards-cardwrap-set"});for(let e=0;e<t.length&&!(e>=2);e++){const a=this.getCard(t[e]);a.setProgressText(e+1,t.length),this.cards.push(a);const r=a.getDOM();e===this.currentCardId&&(r.addClass("h5p-dialogcards-current"),this.$current=r),a.addTipToCard(r.find(".h5p-dialogcards-card-content"),"front",e),s.append(r)}return s},this.handleCardTurned=t=>{this.$cardSideAnnouncer.html(t?this.params.cardFrontLabel:this.params.cardBackLabel),this.params.behaviour.enableRetry&&this.currentCardId+1===this.cardIds.length&&this.$retry&&(this.$retry.removeClass("h5p-dialogcards-disabled"),this.truncateRetryButton())},this.updateNavigation=()=>{if("normal"===this.params.mode)this.getCurrentSelectionIndex()<this.cardIds.length-1?(this.$next.removeClass("h5p-dialogcards-disabled"),this.$retry.addClass("h5p-dialogcards-disabled")):this.$next.addClass("h5p-dialogcards-disabled"),this.currentCardId>0&&!this.params.behaviour.disableBackwardsNavigation?this.$prev.removeClass("h5p-dialogcards-disabled"):this.$prev.addClass("h5p-dialogcards-disabled"),this.$progress.text(this.params.progressText.replace("@card",this.getCurrentSelectionIndex()+1).replace("@total",this.cardIds.length)),this.cards[this.findCardPosition(this.cards[this.currentCardId].id)].resizeOverflowingText();else{this.$round.text(this.params.round.replace("@round",this.round));const t=this.getCurrentSelectionIndex();this.$progress.text(this.params.cardsLeft.replace("@number",this.cardIds.length-t))}this.trigger("resize")},this.showSummary=(t=!1)=>{const s=t?this.cardManager.getPileSizes():this.cardManager.updatePiles(this.results),e=this.results.filter((t=>!0===t.result)).length,a=this.results.length-e,r=this.cardPoolSize-e-a,i=s.slice(-1)[0],d=i===this.cardPoolSize,o={round:this.round,results:[{field:"h5p-dialogcards-round-cards-right",score:{value:e,max:a+e}},{field:"h5p-dialogcards-round-cards-wrong",score:{value:a,max:a+e}},{field:"h5p-dialogcards-round-cards-not-shown",score:{value:r}},{field:"h5p-dialogcards-overall-cards-completed",score:{value:i,max:this.cardPoolSize}},{field:"h5p-dialogcards-overall-completed-rounds",score:{value:this.round}}]};d&&(o.done=!0,o.message=this.params.summaryAllDone.replace("@cards",this.cardPoolSize).replace("@max",this.params.behaviour.maxProficiency)),this.summaryScreen.update(o),this.summaryScreen.show(),this.hideCards(),this.trigger("resize")},this.showCards=()=>{this.$cardwrapperSet.find(".h5p-dialogcards-cardwrap").removeClass("h5p-dialogcards-gone"),this.$footer.removeClass("h5p-dialogcards-gone"),this.cardsShown=!0},this.hideCards=()=>{this.$cardwrapperSet.find(".h5p-dialogcards-cardwrap").addClass("h5p-dialogcards-gone"),this.$footer.addClass("h5p-dialogcards-gone"),this.cardsShown=!1},this.nextCard=t=>{void 0!==t&&this.results.push(t),this.cards[this.currentCardId].stopAudio(),this.cardIds.length-this.getCurrentSelectionIndex()!=1?this.gotoCard(this.getCurrentSelectionIndex()+1):"repetition"===this.params.mode&&(this.$progress.text(this.params.cardsLeft.replace("@number",0)),this.cards[this.currentCardId].showSummaryButton(this.showSummary))},this.getCard=t=>{const s=this.cardManager.getCard(t);return s.createButtonListeners(),s},this.findCardPosition=t=>{let s;return this.cards.forEach(((e,a)=>{s||e.id!==t||(s=a)})),s},this.insertCardToDOM=(t,s)=>{const e=t.getDOM();void 0===s?e.appendTo(this.$cardwrapperSet):0===s?this.$cardwrapperSet.prepend(e):this.$cardwrapperSet.children().eq(s).after(e),t.addTipToCard(e.find(".h5p-dialogcards-card-content"),"front",s)},this.gotoCard=t=>{if(t<0||t>=this.cardIds.length)return;const s=this.cards[this.currentCardId];s.stopAudio(),s.getDOM().removeClass("h5p-dialogcards-current");const e=[];t>0&&e.push(t-1),e.push(t),t+1<this.cardIds.length&&e.push(t+1),e.forEach((t=>{if(void 0===this.findCardPosition(this.cardIds[t])){const s=this.getCard(this.cardIds[t]);s.setProgressText(t+1,this.cardIds.length);const e=Math.min(t+1,this.cardIds.length-1),a=this.findCardPosition(this.cardIds[e])||this.cards.length;this.cards.splice(a,0,s),this.insertCardToDOM(s,a)}})),this.resize(),t=this.findCardPosition(this.cardIds[t]),this.cards.forEach(((s,e)=>{e<t?s.getDOM().addClass("h5p-dialogcards-previous"):(s.getDOM().removeClass("h5p-dialogcards-previous"),e===t&&s.getDOM().addClass("h5p-dialogcards-current"))})),this.currentCardId=t,this.updateNavigation(),this.cards[this.currentCardId].setCardFocus()},this.prevCard=()=>{this.gotoCard(this.getCurrentSelectionIndex()-1)},this.showAllAudio=()=>{this.$cardwrapperSet.find(".h5p-audio-inner").removeClass("hide")},this.restartRepetition=()=>{this.cardManager.reset(),this.round=0,this.nextRound()},this.nextRound=()=>{this.round++,this.summaryScreen.hide(),this.showCards(),this.reset(),this.createDOM(),this.updateNavigation(),this.cards[this.currentCardId].setCardFocus(!0),this.trigger("resize")},this.reset=()=>{this.results=[],this.cards[this.currentCardId].stopAudio(this.$current.index()),this.cards.forEach((t=>{t.reset()})),this.currentCardId=0,"normal"===this.params.mode&&this.cards[this.currentCardId].getDOM().addClass("h5p-dialogcards-current"),this.updateNavigation(),this.$retry&&this.$retry.addClass("h5p-dialogcards-disabled"),this.showAllAudio(),this.cards[this.currentCardId].resizeOverflowingText(),this.cards[this.currentCardId].setCardFocus()},this.resize=()=>{let t=0;this.updateImageSize(),this.params.behaviour.scaleTextNotCard||!1===this.cardsShown||this.determineCardSizes(),this.$cardwrapperSet.css("height","auto"),this.$cardwrapperSet.children(":not(.h5p-dialogcards-gone)").each((function(){const s=o(this).css("height","initial").outerHeight();if(o(this).css("height","inherit"),t=s>t?s:t,!o(this).next(".h5p-dialogcards-cardwrap").length){const s=o(this).find(".h5p-dialogcards-cardholder").css("height","initial").outerHeight();t=s>t?s:t,o(this).find(".h5p-dialogcards-cardholder").css("height","inherit")}}));const s=t/parseFloat(this.$cardwrapperSet.css("font-size"));this.$cardwrapperSet.css("height",s+"em"),this.scaleToFitHeight(),this.truncateRetryButton(),this.cards[this.currentCardId].resizeOverflowingText()},this.determineCardSizes=()=>{const t=this;void 0===this.cardSizeDetermined&&(this.cardSizeDetermined=[]),this.$cardwrapperSet.children(":visible").each((function(s){const e=t.cards[s].id;if(-1!==t.cardSizeDetermined.indexOf(e))return;t.cardSizeDetermined.push(e);const a=o(".h5p-dialogcards-card-content",this),r=o(".h5p-dialogcards-card-text-inner-content",a),i=r[0].getBoundingClientRect().height,d=t.cards[s];d.changeText(d.getAnswer());const n=r[0].getBoundingClientRect().height;let h=i>n?i:n;const c=parseFloat(r.parent().parent().css("minHeight"));h<c&&(h=c);h/=parseFloat(a.css("fontSize")),r.parent().css("height",h+"em"),d.changeText(d.getText())}))},this.scaleToFitHeight=()=>{if(this.$cardwrapperSet&&this.$cardwrapperSet.is(":visible")&&this.params.behaviour.scaleTextNotCard)if(this.$inner.parents(".h5p-course-presentation").length){let t=this.$inner.parent();this.$inner.parents(".h5p-popup-container").length&&(t=this.$inner.parents(".h5p-popup-container"));const s=t.get(0).getBoundingClientRect().height,e=()=>{let t=0;return this.$inner.children().each((function(){const s=o(this);t+=this.getBoundingClientRect().height+parseFloat(s.css("margin-top"))+parseFloat(s.css("margin-bottom"))})),t};let a=e();const r=parseFloat(this.$inner.parent().css("font-size"));let i=parseFloat(this.$inner.css("font-size"));if(s<a)for(;s<a&&(i-=h.SCALEINTERVAL,!(i<h.MINSCALE));)this.$inner.css("font-size",i/r+"em"),a=e();else{let t=!0;for(;t;){if(i+=h.SCALEINTERVAL,i>h.MAXSCALE){t=!1;break}let d=i/r;this.$inner.css("font-size",d+"em"),a=e(),s<=a&&(t=!1,d=(i-h.SCALEINTERVAL)/r,this.$inner.css("font-size",d+"em"))}}}else this.cards[this.currentCardId].resizeOverflowingText()},this.truncateRetryButton=()=>{if(!this.$retry)return;this.$retry.removeClass("truncated"),this.$retry.html(this.params.retry);(this.$retry.get(0).getBoundingClientRect().width+parseFloat(this.$retry.css("margin-left"))+parseFloat(this.$retry.css("margin-right")))/this.$retry.parent().get(0).getBoundingClientRect().width>.3&&(this.$retry.addClass("truncated"),this.$retry.html(""))},this.getCurrentSelectionIndex=()=>this.cardIds.indexOf(this.cards[this.currentCardId].id),this.getTitle=()=>H5P.createTitle(this.contentData&&this.contentData.metadata&&this.contentData.metadata.title?this.contentData.metadata.title:"Dialog Cards"),this.getCurrentState=()=>{if(this.cardManager)return{cardPiles:this.cardManager.getPiles(),cardIds:this.cardIds,round:this.round,currentCardId:this.getCurrentSelectionIndex(),results:this.results}}}}h.idCounter=0,h.SCALEINTERVAL=.2,h.MAXSCALE=16,h.MINSCALE=4;const c=h;H5P.Dialogcards=c})();;
