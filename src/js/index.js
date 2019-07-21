import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

const state = {};


/**
 * //////////////SEARCH CONTROLLER //////////////////
 */
const controlSearch = async () => {
    // 1) get query from view
    const query = searchView.getInput();

    if (query) {
        //2) New search object and add to state
        state.search = new Search(query);

        //3) prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        try {
            //4) Search for recipes
            await state.search.getResults();
    
            // 5) render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch(error) {
            alert('Check controlSearch');
            clearLoader();
        };
    };
};

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});


/**
 * //////////////RECIPE CONTROLLER //////////////////
 */
const controlRecipe = async () => {
    // get id from url
    const id = window.location.hash.replace('#', '');
    console.log(id);

    if (id) {
        //prep UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);
        //hightlight selected recipe
        if (state.search) searchView.highlightSelected(id);
        //create new recipe object
        state.recipe = new Recipe(id);


        try {
            //get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            //calctime and calcservings
            state.recipe.calcTime();
            state.recipe.calcServings();
            //render Recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id),
                );
        } catch (error) {
            alert('check controlRecipe');
        }
    }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event,controlRecipe));

/**
 * //////////////LIST CONTROLLER //////////////////
 */

 const controlList = () => {
     //create a new list if there is none yet
    if (!state.list) state.list = new List();

    //add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
 }

 /// handle delete and update list item events
 elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //handle the delete button.
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // delete from state 
        state.list.deleteItem(id);
        // delete from UI
        listView.deleteItem(id);

    //handle the count update
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id,val);
    }
 });

 /*
 * //////////////LIKE CONTROLLER //////////////////
 */


const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;
    //user has not yet liked current recipe
    if (!state.likes.isLiked(currentID)) {
       // add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img,
        );
        //toggle the like button
        likesView.toggleLikeBtn(true);
        // Add like to UI list
        likesView.renderLike(newLike);
            
    //user LIKES current recipe    
    } else {
        // remove like from the state
        state.likes.deleteLike(currentID);
        //toggle the like button
        likesView.toggleLikeBtn(false);
        // remove like from UI list
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();
    state.likes.readStorage();
    likesView.toggleLikeMenu(state.likes.getNumLikes());
    state.likes.likes.forEach(like => likesView.renderLike(like));
});


//handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches(`.btn-decrease, .btn-decrease *`)) {
        //Decrease button is clicked
        if (state.recipe.servings > 1){
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches(`.btn-increase, .btn-increase *`)) {
        //Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        //add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // Like controller
        controlLike();
    }
});


