wp.customize.controlConstructor['cream-magazine-dropdown-select'] = wp.customize.Control.extend({

    ready: function () {

        'use strict';

        let thisControl = this;

        let selectEle = jQuery('#' + thisControl.id);

        let showSearchVal = (selectEle.data('showsearch') == 'enable') ? true : false;

        new SlimSelect({
            select: '#' + thisControl.id,
            showSearch: showSearchVal,
            contentPosition: 'relative',
            settings: {
                openPosition: 'down' // 'auto', 'up' or 'down'
            }
        });
    }
});