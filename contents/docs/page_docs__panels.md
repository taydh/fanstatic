# OVERVIEW

**Fanstatic Panels** are collections of ready to use elements that optionally powering to your Fanstatic powered website.
They dependend on fanstatic library and used to speed up page building with following benefits:
- provide basic building blocks for typical elements of a websites;
- separated from the underlying content data, configurable, and programmable - just like other javascript UI plugins or widgets;
- provide foundation for **Instant Designs** and design related services.

## PANEL LIST V2

- Layout
  - <a href="#" target="_blank">1 Columns</a>
  - <a href="#" target="_blank">2 Columns</a>
  - <a href="#" target="_blank">3 Columns</a>
  - <a href="#" target="_blank">Admin Panel</a>
- <a href="#" target="_blank">Sections</a>
  - Containerized
  - Containerized Hero
  - Containerized Stack
  - Containerized Grid
- Blocks
  - Basic Unit
  - Basic Block
  - Section Block
  - Axis Panels
  - Grid Panels
  - Login
  - Breadcrump
  - Carousel
  - Cluster
  - Identity
  - Enhanced Image
  - Tab Cells
- Cards
  - Post Card
  - Highlight Card
  - Profile Card
  - Quote Card
  - Rating Card
- Navigation
  - Basic Menu
  - Tab Labels


## CONTENT DATA

When inserting a panel, content data are provided separately.
The library will render a preconfigured structure since developer do not work with the underlying HTML tags.

## STYLING

Along with Panels, the library also include several base style utility and theming. Developer should also learn to override the other styling i.e. colors, font size, and spacing, when incorporating this. 

<script>
	return { 
    renderer: 'markdown',
    classfix: {
      'h2:first-of-type ~ ul': ['list-unstyled d-md-flex flex-align-start flex-wrap', 'gap:1rem'],
      'h2:first-of-type ~ ul > li': ['', 'flex: 1 1 45%;'],
    },
    onload: function(roof) {
      roof.querySelector('li:has(.topic-sections)')
    }
  }
</script>