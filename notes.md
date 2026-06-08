# Deep Time Line

This project is to create a timeline of the full earth history, including
geological, biological, and cultural events.

Initially, I am the audience of this application and its purpose is to help me
remember the dates and sequenc of historical events.  I'm facinated by how long
history is, how recent human civilization is, and how quickly we are developig.  

# Look and feel

A web page with a vertiale time line.  At the top, the creation of earth and at
the bottom the present time.

On the page, from left to right:

- A colume of cultural events.  Actions taken by conscious, sentient beings
- A colume of biological events.  Eveolution of species.  Information about those species.
- The timeline with dates
- A colume of Geological events.  What the earth was doing
- The geological time scale 

There are not lines separating the columes, but information for each category is
kept in it's colume.  Events may have lines connecting to the time scale.

The scale is linear.  In the future we may implement a logrithmic scale.

There are multiple zoom levels.  Zoom level 1 is the whole span of time down.
Higher zoom levels step in by halving span of time until the highest level of 1
year is reached.  Assume a window height (in pixels or inches) the typical size
of a laptop screen and map the current zoom level to that size.  the user can
then scroll throug time at that level

The granularity of events increases as the user zooms in.

The geological time scale has multiple columes to show the eon, era, period, epoch, and age.  
The boxes for each are outlined and colored, using the standard colors.  
As the zoom level increases, the columes for each level
of division may change width.  

- When a colum has only one span, or parts of two spans and the division, the name is rendered vertically and the colum made narrow.
- When a column has elements that are too short to render text into, that column is made narrow and the text not rendered
- Inbetween these two edge cases, there should be a middle set of columns with multiple divisions visible and text rendered horizontal.

The intended effect as that at low zoom levels the epoch and age columns are compressed while at
higher zoom levels the eon and age columns are compressed and the epoch and age fully rendered.  

There is a search function.



# Event information

Events have the following attributes

- Events have a name which is short enough to display
- Some events are a single point in time while other events have a start date and end date
- We obviously need different resolutions for the time of events
  - Some events are measured in millions of years ago or thousands of years ago
  - Some events have resolution down to a century, decade, or year
  - Some events may be given an exact date
  - Some events may be given an exact time.
- We will need different ways to express the time of an event
  - "Years ago", "Thousands of years ago", "Millions of years ago"
  - Gregorian year
  - Geegorian date
  - Gregorian date-time
- Events can be tagged.  There may be multiple tags.  
  - We will need a tag management system.
- Events have a short discription, which may be displayed in a pop up window.  May be plane text, HTML, or Markdown
- Events have links to forther inforamtion about them.

What other attributes does a event need?

## Event Store

Events will be stored in a database.  

- We will attempt to pre-populate the database with significant events
- Significant updates to the database are likely to come from:
  - Use of AI to read some text and generate events
  - Conversion of events from some other database into our format
  - A human inserting individual events
- The deep timeline app will have read access to the database.  These other
  update methods will have read-write access.
- To facilitate update by various tools, selection of a database server is
  probably preferred over SQLite.





# Examples

There are several example web sites.  None of these satisfied my needs but do
have some features to consider.  They may also be sources of events.

## Deep Time Navigator

URL:  https://deep-timeline.org

Uses a horizontal timeline and displays text on an angle.  I find the angled
text difficult to read.  There are no links to information about the events.

## Civilizations Atlas

URL:  https://civilisationatlas.com

Human civilizations.

## ChronoEarth


URL:  https://www.chronoearth.ai

Has significant geological events.


# Next Steps

"continue with the deeptimeline project"

Scroll bar to show location in time line.

Importance level selector.  Tied to the zoom level but can be individually controlled.  
Locked / unlocked.  

Ingest data.