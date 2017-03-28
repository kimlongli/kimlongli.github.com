/**
 * SyntaxHighlighter
 * http://alexgorbatchev.com/SyntaxHighlighter
 *
 * SyntaxHighlighter is donationware. If you are using it, please donate.
 * http://alexgorbatchev.com/SyntaxHighlighter/donate.html
 *
 * @version
 * 3.0.83 (July 02 2010)
 * 
 * @copyright
 * Copyright (C) 2004-2010 Alex Gorbatchev.
 *
 * @license
 * Dual licensed under the MIT and GPL licenses.
 */
;(function()
{
	// CommonJS
	typeof(require) != 'undefined' ? SyntaxHighlighter = require('shCore').SyntaxHighlighter : null;

	function Brush()
	{
		// AppleScript brush by David Chambers
		// http://davidchambersdesign.com/
		var keywords   = 'after before beginning continue copy each end every from return get global in local named of set some that the then times to where whose with without';
		var ordinals   = 'first second third fourth fifth sixth seventh eighth ninth tenth last front back middle';
		var specials   = 'activate add alias AppleScript ask attachment boolean class constant delete duplicate empty exists false id integer list make message modal modified new no paragraph pi properties quit real record remove rest result reveal reverse run running save string true word yes';

		this.regexList = [

			{ regex: /(--|#).*$/gm,
			    css: 'comments' },

			{ regex: /\(\*(?:[\s\S]*?\(\*[\s\S]*?\*\))*[\s\S]*?\*\)/gm, // support nested comments
			    css: 'comments' },

			{ regex: /"[\s\S]*?"/gm,
			    css: 'string' },

			{ regex: /(?:,|:|¬|'s\b|\(|\)|\{|\}|«|\b\w*»)/g,
			    css: 'color1' },

			{ regex: /(-)?(\d)+(\.(\d)?)?(E\+(\d)+)?/g, // numbers
			    css: 'color1' },

			{ regex: /(?:&(amp;|gt;|lt;)?|=|� |>|<|≥|>=|≤|</|≥|>